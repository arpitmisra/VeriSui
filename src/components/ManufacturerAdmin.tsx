// import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
// import { TransactionBlock } from '@mysten/sui.js/transactions';
// import { useState } from 'react';

// // !!! IMPORTANT: REPLACE THESE WITH YOUR ACTUAL DEPLOYMENT VALUES !!!
// const PACKAGE_ID = "0x212d0179b696f53999fef0a9bead0ac59679d6a3dceb4d9b3c16e4d31b84a568"; 
// const ADMIN_CAP_ID = "0x4cfd91b9f40b3dda22c7e7de665398769bf4692fab3858f9e9aaef1be5454eb3"; 
// const OWNER_ADDRESS = "0x951fb389491f1bf0af780f23b825e5a0b101ff79ae6a584156a525980398533d"; // The address that owns the ADMIN_CAP_ID

// export function ManufacturerAdmin() {
//     const { mutate: signAndExecute } = useSignAndExecuteTransaction();
//     const account = useCurrentAccount();
//     const [brand, setBrand] = useState('');
//     const [serial, setSerial] = useState('');

//     const handleMint = () => {
//         const txb = new TransactionBlock();
//         txb.moveCall({
//             target: `${PACKAGE_ID}::product::mint_product`,
//             arguments: [
//                 txb.object(ADMIN_CAP_ID),
//                 txb.pure.string(brand),
//                 txb.pure.u64(Number(serial)),
//                 txb.object('0x6'), // Sui Clock object
//             ],
//         });

//         signAndExecute({ transaction: txb.serialize() }, {
//             onSuccess: (result: { digest: string }) => {
//                 alert(`Product minted successfully! Digest: ${result.digest}`);
//                 setBrand('');
//                 setSerial('');
//             },
//         });
//     };
    
//     // Only render this component if the connected account is the owner
//     if (account?.address !== OWNER_ADDRESS) {
//         return null;
//     }

//     return (
//         <div className="admin-panel">
//             <h2>Manufacturer Panel</h2>
//             <input type="text" placeholder="Brand Name" value={brand} onChange={(e) => setBrand(e.target.value)} />
//             <input type="number" placeholder="Serial Number" value={serial} onChange={(e) => setSerial(e.target.value)} />
//             <button onClick={handleMint} disabled={!brand || !serial}>Mint Product</button>
//         </div>
//     );
// }

import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useState } from 'react';
import { 
    Box, 
    Fingerprint, 
    AlertCircle, 
    Package, 
    Tag, 
    Factory,
    Info,
    Loader
} from 'lucide-react';
import { ManufacturerOverview } from './ManufacturerOverview';
import './ManufacturerAdmin.css';

// ACTUAL DEPLOYMENT VALUES FROM YOUR TRANSACTION
const PACKAGE_ID = "0x212d0179b696f53999fef0a9bead0ac59679d6a3dceb4d9b3c16e4d31b84a568"; 
const MANUFACTURER_CAP_ID = "0x4cfd91b9f40b3dda22c7e7de665398769bf4692fab3858f9e9aaef1be5454eb3"; // ManufacturerCap object
const OWNER_ADDRESS = "0x951fb389491f1bf0af780f23b825e5a0b101ff79ae6a584156a525980398533d"; // Your address

export function ManufacturerAdmin() {
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const account = useCurrentAccount();
    const [brand, setBrand] = useState('');
    const [serial, setSerial] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showDebug, setShowDebug] = useState(false);

    const handleMint = async () => {
        if (!account) {
            alert('Please connect your wallet first');
            return;
        }

        if (!brand.trim() || !serial.trim()) {
            alert('Please fill in both brand and serial number');
            return;
        }

        setIsLoading(true);

        try {
            const txb = new TransactionBlock();
            
            txb.moveCall({
                target: `${PACKAGE_ID}::product::mint_product`,
                arguments: [
                    txb.object(MANUFACTURER_CAP_ID), // Using ManufacturerCap
                    txb.pure.string(brand.trim()),
                    txb.pure.u64(Number(serial)),
                    txb.object('0x6'), // Sui Clock object
                ],
            });

            signAndExecute(
                { 
                    transaction: txb.serialize()
                },
                {
                    onSuccess: (result) => {
                        console.log('Minting successful:', result);
                        alert(`Product minted successfully! Digest: ${result.digest}`);
                        setBrand('');
                        setSerial('');
                        setIsLoading(false);
                    },
                    onError: (error) => {
                        console.error('Minting error:', error);
                        alert(`Error minting product: ${error.message || 'Unknown error occurred'}`);
                        setIsLoading(false);
                    }
                }
            );
        } catch (err: any) {
            console.error('Transaction setup error:', err);
            alert(`Error setting up transaction: ${err?.message || 'Unknown error occurred'}`);
            setIsLoading(false);
        }
    };
    
    if (account?.address !== OWNER_ADDRESS) {
        return (
            <div className="admin-panel admin-panel-error">
                <h2><AlertCircle className="icon" /> Access Denied</h2>
                <div className="error-message">
                    <p>Only the manufacturer can access this panel.</p>
                    <div className="account-info">
                        <p><Fingerprint className="icon" /> Connected: {account?.address || 'Not connected'}</p>
                        <p><Factory className="icon" /> Required: {OWNER_ADDRESS}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="admin-panel">
                <h2><Factory className="icon" /> Manufacturer Panel</h2>
                <div className="mint-section">
                    <h3><Package className="icon" /> Mint New Product</h3>
                    <div className="form-group">
                        <label htmlFor="brand">
                            <Tag className="icon" /> Brand Name:
                        </label>
                        <input 
                            id="brand"
                            type="text" 
                            placeholder="Enter brand name" 
                            value={brand} 
                            onChange={(e) => setBrand(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="serial">
                            <Box className="icon" /> Serial Number:
                        </label>
                        <input 
                            id="serial"
                            type="number" 
                            placeholder="Enter serial number" 
                            value={serial} 
                            onChange={(e) => setSerial(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <button 
                        onClick={handleMint} 
                        disabled={!brand.trim() || !serial.trim() || isLoading}
                        className={`button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader className="icon spin" />
                                Minting...
                            </>
                        ) : (
                            <>
                                <Package className="icon" />
                                Mint Product
                            </>
                        )}
                    </button>
                </div>

                <div className="products-overview">
                    <ManufacturerOverview packageId={PACKAGE_ID} />
                </div>
            </div>

            <div className={`debug-panel`}>
                <button 
                    className="debug-toggle"
                    onClick={() => setShowDebug(!showDebug)}
                >
                    <Info size={20} />
                </button>
                {showDebug && (
                    <div className="debug-content">
                        <h3><Info className="icon" /> Debug Information</h3>
                        <div className="debug-item">
                            <strong>Package ID:</strong>
                            <code>{PACKAGE_ID}</code>
                        </div>
                        <div className="debug-item">
                            <strong>Manufacturer Cap:</strong>
                            <code>{MANUFACTURER_CAP_ID}</code>
                        </div>
                        <div className="debug-item">
                            <strong>Connected Account:</strong>
                            <code>{account?.address}</code>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}