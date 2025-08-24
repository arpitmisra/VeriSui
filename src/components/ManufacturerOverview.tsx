import { useSuiClient } from '@mysten/dapp-kit';
import './ManufacturerOverview.css';
import { useEffect, useState } from 'react';

interface Product {
    objectId: string;
    brand: string;
    serial_number: string;
    owner_history: string[];
    timestamp_history: number[];
    price_history: number[];
}

interface ManufacturerOverviewProps {
    packageId: string;
}

export function ManufacturerOverview({ packageId }: ManufacturerOverviewProps) {
    const suiClient = useSuiClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching with package ID:', packageId);
            
            const query = await suiClient.queryTransactionBlocks({
                filter: {
                    MoveFunction: {
                        package: packageId,
                        module: 'product',
                        function: 'mint_product'
                    }
                },
                options: {
                    showEffects: true,
                    showInput: true,
                }
            });

            console.log('Query response:', query);

            // First, find all transaction digests
            const digests = query.data.map(tx => tx.digest);
            console.log('Transaction digests:', digests);

            // Now get the detailed transaction effects
            const txEffects = await Promise.all(
                digests.map(digest => 
                    suiClient.getTransactionBlock({
                        digest,
                        options: {
                            showEffects: true,
                            showInput: true,
                            showEvents: true,
                        }
                    })
                )
            );
            console.log('Transaction effects:', txEffects);

            // Extract created object IDs
            const allObjectIds = txEffects
                .flatMap(tx => 
                    tx.effects?.created?.map(obj => obj.reference?.objectId) || []
                )
                .filter(Boolean) as string[];
                
            console.log('Extracted object IDs:', allObjectIds);

            console.log('Found object IDs:', allObjectIds);

            if (allObjectIds.length === 0) {
                console.log('No objects found, setting empty products array');
                setProducts([]);
                return;
            }

            // Fetch the current state of all products
            console.log('Fetching objects details...');
            const objects = await suiClient.multiGetObjects({
                ids: allObjectIds,
                options: {
                    showContent: true,
                    showOwner: true,
                    showType: true
                }
            });

            console.log('Raw objects:', objects);

            const productDetails = objects
                .filter(obj => {
                    // Log the entire object structure for debugging
                    console.log('Processing object:', JSON.stringify(obj, null, 2));
                    
                    // Check the object's content structure
                    const data = obj.data;
                    const type = data?.type;
                    const content = data?.content;
                    
                    console.log('Object Structure:', {
                        objectId: data?.objectId,
                        type: type,
                        hasContent: !!content,
                        contentType: content?.dataType,
                        fields: content?.fields
                    });
                    
                    // Include all objects, we'll filter properly in the map
                    return true;
                })
                .map(obj => {
                    const data = obj.data;
                    if (!data) {
                        console.log('No data in object:', obj);
                        return null;
                    }

                    // Get the move object
                    const content = data.content as { dataType: string; fields?: any };
                    if (!content || content.dataType !== 'moveObject') {
                        console.log('Invalid content or not a move object:', content);
                        return null;
                    }

                    const fields = content.fields || {};
                    console.log('Move object fields:', fields);
                    
                    if (typeof fields !== 'object') {
                        console.log('No valid fields in object:', content);
                        return null;
                    }

                    // Create the product object with proper type checking
                    const product = {
                        objectId: data.objectId || '',
                        brand: String(fields.brand || ''),
                        serial_number: String(fields.serial_number || ''),
                        owner_history: Array.isArray(fields.owner_history) ? fields.owner_history.map(String) : [],
                        timestamp_history: Array.isArray(fields.timestamp_history) 
                            ? fields.timestamp_history.map(Number) 
                            : [],
                        price_history: Array.isArray(fields.price_history) 
                            ? fields.price_history.map(Number) 
                            : []
                    } as Product;

                    console.log('Created product:', product);
                    return product;
                })
                .filter((p): p is Product => p !== null);

            console.log('Final product details:', productDetails);
            setProducts(productDetails);
        } catch (err: any) {
            console.error('Error fetching products:', err);
            setError(err.message || 'Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllProducts();
        // Set up polling to refresh data every 30 seconds
        const interval = setInterval(fetchAllProducts, 30000);
        return () => clearInterval(interval);
    }, [packageId]);

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatPrice = (price: number) => {
        return (price / 1_000_000_000).toFixed(9) + ' SUI';
    };

    if (loading) {
        return <div>Loading all products...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="manufacturer-overview">
            <h2>All Products Overview</h2>
            <button onClick={fetchAllProducts} className="refresh-button">
                Refresh Products
            </button>
            {products.length === 0 ? (
                <p>No products have been minted yet.</p>
            ) : (
                <div className="products-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Brand</th>
                                <th>Serial Number</th>
                                <th>Current Owner</th>
                                <th>Ownership History</th>
                                <th>Transaction History</th>
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
                                            <summary>{product.owner_history.length} transfers</summary>
                                            <ul className="history-list">
                                                {product.owner_history.map((owner, index) => (
                                                    <li key={index}>
                                                        <div>Owner: <code>{owner}</code></div>
                                                        <div>Time: {formatTimestamp(product.timestamp_history[index])}</div>
                                                        <div>Price: {formatPrice(product.price_history[index])}</div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    </td>
                                    <td>
                                        <a 
                                            href={`https://suiexplorer.com/object/${product.objectId}?network=testnet`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            View on Explorer
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
