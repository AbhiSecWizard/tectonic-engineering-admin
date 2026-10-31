import { Route, Routes } from "react-router-dom"
import PageLoader from "./components/PageLoader"
import AdminLayout from "./layout/AdminLayout"
import Blog from "./pages/Blog"

const App = () => {
  return (
    <>
     <AdminLayout/>
       
     <PageLoader/>
    </>
  )
}

export default App
