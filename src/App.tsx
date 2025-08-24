import { ConnectButton, useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useEffect, useState } from 'react';
import { ManufacturerAdmin } from './components/ManufacturerAdmin';
import { ProductCard } from './components/ProductCard';
import './App.css';

// ACTUAL DEPLOYMENT VALUES FROM YOUR TRANSACTION
const PACKAGE_ID = "0x212d0179b696f53999fef0a9bead0ac59679d6a3dceb4d9b3c16e4d31b84a568";

function App() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [userProducts, setUserProducts] = useState<any[]>([]);

  const fetchProducts = async () => {
    if (!account) return;
    
    try {
      const objects = await suiClient.getOwnedObjects({ 
        owner: account.address,
        options: {
          showType: true,
          showContent: true
        }
      });
      
      const productIds = objects.data
        .filter(obj => obj.data?.type?.includes(`${PACKAGE_ID}::product::Product`))
        .map(obj => obj.data?.objectId)
        .filter(Boolean);

      if (productIds.length === 0) {
        setUserProducts([]);
        return;
      }

      const products = await suiClient.multiGetObjects({ 
        ids: productIds as string[], 
        options: { showContent: true } 
      });
      
      const formattedProducts = products.map(p => ({
        objectId: p.data?.objectId,
        ...(p.data?.content as any)?.fields
      }));
      
      setUserProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [account]);

  const handleTransfer = (objectId: string) => {
    const recipient = prompt("Enter recipient address:");
    const price = prompt("Enter sale price in SUI (e.g., 10.5):");
    
    if (!recipient || !price) return;
    
    const priceInMist = Math.floor(parseFloat(price) * 1_000_000_000);

    const txb = new TransactionBlock();
    txb.moveCall({
      target: `${PACKAGE_ID}::product::transfer_product`,
      arguments: [
        txb.object(objectId),
        txb.pure.address(recipient),
        txb.pure.u64(priceInMist),
        txb.object('0x6'), // Clock
      ],
    });

    signAndExecute(
      { transaction: txb.serialize() },
      {
        onSuccess: (result) => {
          alert(`Transfer successful! Digest: ${result.digest}`);
          fetchProducts(); // Refresh the product list
        },
        onError: (error) => {
          console.error('Transfer error:', error);
          alert(`Error transferring product: ${error.message}`);
        }
      }
    );
  };

  return (
    <>
      <nav className="navbar">
        <h2>VeriSui</h2>
        <ConnectButton />
      </nav>
      <main className="container">
        <ManufacturerAdmin />
        <div className="dashboard">
          <h2>My Products</h2>
          {account && userProducts.length === 0 && <p>You do not own any products yet.</p>}
          {!account && <p>Please connect your wallet to see your products.</p>}
          <div className="product-grid">
            {userProducts.map(product => (
              <ProductCard key={product.objectId} product={product} onTransfer={handleTransfer} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export default App;