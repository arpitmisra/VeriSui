// import { useState } from 'react';

// // Define the structure of our Product object
// interface Product {
//     objectId: string;
//     brand: string;
//     serial_number: string;
//     owner_history: string[];
//     timestamp_history: string[];
//     price_history: string[];
// }

// export function ProductCard({ product, onTransfer }: { product: Product, onTransfer: (id: string) => void }) {
//     const [showHistory, setShowHistory] = useState(false);

//     return (
//         <div className="product-card">
//             <h3>{product.brand}</h3>
//             <p>Serial #: {product.serial_number}</p>
//             <p><strong>Object ID:</strong> <code>{product.objectId}</code></p>
//             <div className="card-actions">
//                 <button onClick={() => onTransfer(product.objectId)}>Transfer</button>
//                 <button onClick={() => setShowHistory(!showHistory)}>
//                     {showHistory ? 'Hide' : 'Show'} History
//                 </button>
//             </div>
//             {showHistory && (
//                 <div className="history-log">
//                     <h4>Provenance History</h4>
//                     <ul>
//                         {product.owner_history.map((owner, index) => (
//                             <li key={index}>
//                                 <strong>Owner:</strong> <code>{owner}</code><br />
//                                 <strong>Date:</strong> {new Date(parseInt(product.timestamp_history[index])).toLocaleString()}<br />
//                                 <strong>Price:</strong> {parseInt(product.price_history[index]) / 1_000_000_000} SUI
//                             </li>
//                         ))}
//                     </ul>
//                 </div>
//             )}
//         </div>
//     );
// }

import { useState } from 'react';

// Define the structure of our Product object
interface Product {
    objectId: string;
    brand: string;
    serial_number: string;
    owner_history: string[];
    timestamp_history: string[];
    price_history: string[];
}

export function ProductCard({ product, onTransfer }: { product: Product, onTransfer: (id: string) => void }) {
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className="product-card">
            <h3>{product.brand}</h3>
            <p>Serial #: {product.serial_number}</p>
            <p><strong>Object ID:</strong> <code>{product.objectId}</code></p>
            <div className="card-actions">
                <button onClick={() => onTransfer(product.objectId)}>Transfer</button>
                <button onClick={() => setShowHistory(!showHistory)}>
                    {showHistory ? 'Hide' : 'Show'} History
                </button>
            </div>
            {showHistory && (
                <div className="history-log">
                    <h4>Provenance History</h4>
                    {product.owner_history && product.owner_history.length > 0 ? (
                        <ul>
                            {product.owner_history.map((owner, index) => (
                                <li key={index}>
                                    <strong>Owner:</strong> <code>{owner}</code><br />
                                    <strong>Date:</strong> {
                                        product.timestamp_history && product.timestamp_history[index]
                                            ? new Date(parseInt(product.timestamp_history[index])).toLocaleString()
                                            : 'N/A'
                                    }<br />
                                    <strong>Price:</strong> {
                                        product.price_history && product.price_history[index]
                                            ? (parseInt(product.price_history[index]) / 1_000_000_000).toFixed(4) + ' SUI'
                                            : 'N/A'
                                    }
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No history available yet.</p>
                    )}
                </div>
            )}
        </div>
    );
}