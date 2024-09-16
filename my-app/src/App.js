import React from 'react';
import './App.css';
import logo from './logo.svg';
import ModelViewer from './ModelViewer'; // Импорт компонента ModelViewer

function App() {
  return (
    <div className="App">
    
      
      {/* Встраиваем компонент ModelViewer под заголовком */}
      <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
        <ModelViewer />
      </div>
    </div>
  );
}

export default App;