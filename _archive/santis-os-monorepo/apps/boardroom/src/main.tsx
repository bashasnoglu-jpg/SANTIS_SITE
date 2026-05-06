import React from 'react'
import ReactDOM from 'react-dom/client'
import BoardroomPage from './features/boardroom/BoardroomPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BoardroomPage />
  </React.StrictMode>
)
