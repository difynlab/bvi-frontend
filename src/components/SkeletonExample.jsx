import React from 'react';
import { Skeleton } from 'react-loading-skeleton';

const SkeletonExample = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Skeleton Loading Example</h2>
      
      {/* Ejemplo de skeleton para texto */}
      <Skeleton height={20} width={200} style={{ marginBottom: '10px' }} />
      
      {/* Ejemplo de skeleton para párrafo */}
      <Skeleton count={3} height={15} style={{ marginBottom: '20px' }} />
      
      {/* Ejemplo de skeleton para imagen */}
      <Skeleton height={150} style={{ marginBottom: '20px' }} />
      
      {/* Ejemplo de skeleton para botón */}
      <Skeleton height={40} width={120} style={{ borderRadius: '8px' }} />
    </div>
  );
};

export default SkeletonExample;
