import { useSuiClient, useCurrentWallet } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';

interface ProductFields {
    brand: string;
    serial_number: string;
    owner_history: string[];
    timestamp_history: string[];
    price_history: string[];
}

interface Product extends ProductFields {
    objectId: string;
}

interface ManufacturerOverviewProps {
    packageId: string;
}

export function ManufacturerOverview({ packageId }: ManufacturerOverviewProps) {
    const suiClient = useSuiClient();
    const { chain } = useCurrentWallet();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllProducts = async () => {
        if (!packageId) return;
        setLoading(true);
        setError(null);
        try {
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

            const productObjectIds = txs.data
                .flatMap((tx) =>
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
            const objects = await suiClient.multiGetObjects({
                ids: productObjectIds,
                options: {
                    showContent: true,
                },
            });
            const productDetails = objects
                .map((obj) => {
                    if (obj.data && obj.data.content && obj.data.content.dataType === 'moveObject') {
                        return {
                            objectId: obj.data.objectId,
                            ...(obj.data.content.fields as ProductFields),
                        };
                    }
                    return null;
                })
                .filter((p): p is Product => p !== null);

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

    const getExplorerUrl = (objectId: string) => {
        const networkName = chain?.id.split(':')[1] || 'testnet'; 
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

