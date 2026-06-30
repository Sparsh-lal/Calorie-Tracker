import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: '100px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: '500',
          },
        }}
      />
    </Provider>
  </React.StrictMode>
)
