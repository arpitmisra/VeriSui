// import { useSuiClient } from '@mysten/dapp-kit';
// import './ManufacturerOverview.css';
// import { useEffect, useState } from 'react';

// interface Product {
//     objectId: string;
//     brand: string;
//     serial_number: string;
//     owner_history: string[];
//     timestamp_history: number[];
//     price_history: number[];
// }

// interface ManufacturerOverviewProps {
//     packageId: string;
// }

// export function ManufacturerOverview({ packageId }: ManufacturerOverviewProps) {
//     const suiClient = useSuiClient();
//     const [products, setProducts] = useState<Product[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const fetchAllProducts = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             console.log('Fetching with package ID:', packageId);
            
//             const query = await suiClient.queryTransactionBlocks({
//                 filter: {
//                     MoveFunction: {
//                         package: packageId,
//                         module: 'product',
//                         function: 'mint_product'
//                     }
//                 },
//                 options: {
//                     showEffects: true,
//                     showInput: true,
//                 }
//             });

//             console.log('Query response:', query);

//             // First, find all transaction digests
//             const digests = query.data.map(tx => tx.digest);
//             console.log('Transaction digests:', digests);

//             // Now get the detailed transaction effects
//             const txEffects = await Promise.all(
//                 digests.map(digest => 
//                     suiClient.getTransactionBlock({
//                         digest,
//                         options: {
//                             showEffects: true,
//                             showInput: true,
//                             showEvents: true,
//                         }
//                     })
//                 )
//             );
//             console.log('Transaction effects:', txEffects);

//             // Extract created object IDs
//             const allObjectIds = txEffects
//                 .flatMap(tx => 
//                     tx.effects?.created?.map(obj => obj.reference?.objectId) || []
//                 )
//                 .filter(Boolean) as string[];
                
//             console.log('Extracted object IDs:', allObjectIds);

//             console.log('Found object IDs:', allObjectIds);

//             if (allObjectIds.length === 0) {
//                 console.log('No objects found, setting empty products array');
//                 setProducts([]);
//                 return;
//             }

//             // Fetch the current state of all products
//             console.log('Fetching objects details...');
//             const objects = await suiClient.multiGetObjects({
//                 ids: allObjectIds,
//                 options: {
//                     showContent: true,
//                     showOwner: true,
//                     showType: true
//                 }
//             });

//             console.log('Raw objects:', objects);

//             const productDetails = objects
//                 .filter(obj => {
//                     // Log the entire object structure for debugging
//                     console.log('Processing object:', JSON.stringify(obj, null, 2));
                    
//                     // Check the object's content structure
//                     const data = obj.data;
//                     const type = data?.type;
//                     const content = data?.content;
                    
//                     console.log('Object Structure:', {
//                         objectId: data?.objectId,
//                         type: type,
//                         hasContent: !!content,
//                         contentType: content?.dataType,
//                         fields: content?.fields
//                     });
                    
//                     // Include all objects, we'll filter properly in the map
//                     return true;
//                 })
//                 .map(obj => {
//                     const data = obj.data;
//                     if (!data) {
//                         console.log('No data in object:', obj);
//                         return null;
//                     }

//                     // Get the move object
//                     const content = data.content as { dataType: string; fields?: any };
//                     if (!content || content.dataType !== 'moveObject') {
//                         console.log('Invalid content or not a move object:', content);
//                         return null;
//                     }

//                     const fields = content.fields || {};
//                     console.log('Move object fields:', fields);
                    
//                     if (typeof fields !== 'object') {
//                         console.log('No valid fields in object:', content);
//                         return null;
//                     }

//                     // Create the product object with proper type checking
//                     const product = {
//                         objectId: data.objectId || '',
//                         brand: String(fields.brand || ''),
//                         serial_number: String(fields.serial_number || ''),
//                         owner_history: Array.isArray(fields.owner_history) ? fields.owner_history.map(String) : [],
//                         timestamp_history: Array.isArray(fields.timestamp_history) 
//                             ? fields.timestamp_history.map(Number) 
//                             : [],
//                         price_history: Array.isArray(fields.price_history) 
//                             ? fields.price_history.map(Number) 
//                             : []
//                     } as Product;

//                     console.log('Created product:', product);
//                     return product;
//                 })
//                 .filter((p): p is Product => p !== null);

//             console.log('Final product details:', productDetails);
//             setProducts(productDetails);
//         } catch (err: any) {
//             console.error('Error fetching products:', err);
//             setError(err.message || 'Failed to fetch products');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchAllProducts();
//         // Set up polling to refresh data every 30 seconds
//         const interval = setInterval(fetchAllProducts, 30000);
//         return () => clearInterval(interval);
//     }, [packageId]);

//     const formatTimestamp = (timestamp: number) => {
//         return new Date(timestamp).toLocaleString();
//     };

//     const formatPrice = (price: number) => {
//         return (price / 1_000_000_000).toFixed(9) + ' SUI';
//     };

//     if (loading) {
//         return <div>Loading all products...</div>;
//     }

//     if (error) {
//         return <div className="error">Error: {error}</div>;
//     }

//     return (
//         <div className="manufacturer-overview">
//             <h2>All Products Overview</h2>
//             <button onClick={fetchAllProducts} className="refresh-button">
//                 Refresh Products
//             </button>
//             {products.length === 0 ? (
//                 <p>No products have been minted yet.</p>
//             ) : (
//                 <div className="products-table">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Brand</th>
//                                 <th>Serial Number</th>
//                                 <th>Current Owner</th>
//                                 <th>Ownership History</th>
//                                 <th>Transaction History</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {products.map((product) => (
//                                 <tr key={product.objectId}>
//                                     <td>{product.brand}</td>
//                                     <td>{product.serial_number}</td>
//                                     <td>
//                                         <code>{product.owner_history[product.owner_history.length - 1]}</code>
//                                     </td>
//                                     <td>
//                                         <details>
//                                             <summary>{product.owner_history.length} transfers</summary>
//                                             <ul className="history-list">
//                                                 {product.owner_history.map((owner, index) => (
//                                                     <li key={index}>
//                                                         <div>Owner: <code>{owner}</code></div>
//                                                         <div>Time: {formatTimestamp(product.timestamp_history[index])}</div>
//                                                         <div>Price: {formatPrice(product.price_history[index])}</div>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                         </details>
//                                     </td>
//                                     <td>
//                                         <a 
//                                             href={`https://suiexplorer.com/object/${product.objectId}?network=testnet`}
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                         >
//                                             View on Explorer
//                                         </a>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// }


import { useSuiClient, useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

// Define the structure of our Product object's fields
interface ProductFields {
    brand: string;
    serial_number: string;
    owner_history: string[];
    timestamp_history: string[];
    price_history: string[];
}

// Define the final structure of the Product object we'll use in the component
interface Product extends ProductFields {
    objectId: string;
}

interface ManufacturerOverviewProps {
    packageId: string;
}

export function ManufacturerOverview({ packageId }: ManufacturerOverviewProps) {
    const suiClient = useSuiClient();
    const { chain } = useCurrentWallet(); // CORRECTED: Get network info from useCurrentWallet
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = async () => {
        if (!packageId) return;
        setLoading(true);
        setError(null);
        try {
            // Step 1: Query for all transactions that called the 'mint_product' function.
            // This is the most effective way to find all products ever created by this package
            // without using a centralized indexer. We get the effects directly.
            const txs = await suiClient.queryTransactionBlocks({
                filter: {
                    MoveFunction: {
                        package: packageId,
                        module: 'product',
                        function: 'mint_product',
                    },
                },
                options: {
                    showEffects: true,
                },
            });

            // Step 2: Extract the Object IDs of the created 'Product' objects from the transaction effects.
            const productObjectIds = txs.data
                .flatMap((tx) =>
                    // tx.effects?.created can contain multiple created objects, so we find the one that is our Product.
                    (tx.effects?.created || []).filter(
                        (obj) => obj.owner !== 'Immutable' && obj.reference.objectId,
                    ),
                )
                .map((obj) => obj.reference.objectId);
            
            if (productObjectIds.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            // Step 3: Fetch the current state of all identified Product objects in a single batch call.
            const objects = await suiClient.multiGetObjects({
                ids: productObjectIds,
                options: {
                    showContent: true,
                },
            });

            // Step 4: Parse the objects and format them into the 'Product' type for our component.
            // This is the CRITICAL part that fixes the Vercel deployment error.
            const productDetails = objects
                .map((obj) => {
                    // Check if the object data and content exist and if it's a 'moveObject'.
                    if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
                        return {
                            objectId: obj.data.objectId,
                            ...(obj.data.content.fields as ProductFields),
                        };
                    }
                    return null; // Return null for any invalid or non-matching objects
                })
                .filter((p): p is Product => p !== null); // Filter out any nulls to ensure type safety.

            setProducts(productDetails);
        } catch (err: any) {
            console.error('Error fetching all products:', err);
            setError(err.message || 'Failed to fetch product overview.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllProducts();
    }, [packageId, suiClient]);

    if (loading) {
        return <div>Loading all minted products...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Helper to get the correct explorer URL based on the connected network
    const getExplorerUrl = (objectId: string) => {
        // CORRECTED: use the 'chain' object from useCurrentWallet
        const networkName = chain?.id.split(':')[1] || 'testnet'; // Defaults to testnet if network is not found
        return `https://suiexplorer.com/object/${objectId}?network=${networkName}`;
    }

    return (
        <div className="manufacturer-overview">
            <h2>All Minted Products ({products.length})</h2>
            <button onClick={fetchAllProducts} className="refresh-button">
                Refresh List
            </button>
            {products.length === 0 ? (
                <p>No products have been minted from this package yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Brand</th>
                            <th>Serial Number</th>
                            <th>Current Owner</th>
                            <th>History</th>
                            <th>Explorer Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.objectId}>
                                <td>{product.brand}</td>
                                <td>{product.serial_number}</td>
                                <td>
                                    <code>{product.owner_history[product.owner_history.length - 1]}</code>
                                </td>
                                <td>
                                    <details>
                                        <summary>{product.owner_history.length} owner(s)</summary>
                                        <ul>
                                            {product.owner_history.map((owner, index) => (
                                                <li key={index}>
                                                    <strong>Owner:</strong> <code>{owner}</code><br />
                                                    <strong>Date:</strong> {new Date(parseInt(product.timestamp_history[index])).toLocaleString()}<br />
                                                    <strong>Price:</strong> {parseInt(product.price_history[index]) / 1_000_000_000} SUI
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                </td>
                                <td>
                                    <a href={getExplorerUrl(product.objectId)} target="_blank" rel="noopener noreferrer">
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

