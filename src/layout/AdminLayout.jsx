// import { useState } from "react";
// import { Outlet, Route, Routes } from "react-router-dom";
// import { FaBars } from "react-icons/fa6";
// import Sidebar from "./Sidebar";
// import Blog from "../pages/Blog";
// import Dashboard from "../pages/Dashboard";
// import Clients from "../pages/Clients";
// import Projects from "../pages/Projects";
// import Gallery from "../pages/Gallery";
// import Team from "../pages/Team";
// import Login from "../pages/Login";

// const AdminLayout = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex min-h-screen bg-background">
//       {/* Sidebar */}
//       <Sidebar
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//       />

//       {/* Main Content */}
//       <div className="flex min-w-0 flex-1 flex-col">
//         {/* Mobile / Tablet Header */}
//         <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 lg:hidden">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             aria-label="Open menu"
//             className="rounded-md p-2 text-heading transition hover:bg-background"
//           >
//             <FaBars size={22} />
//           </button>

//           <span className="font-bold text-heading">
//             Admin Panel
//           </span>
//         </header>

//         {/* Current Route */}
//             <Routes>
//       <Route path="/" element={<Dashboard/>}/>
//       <Route path="/admin" element={<Dashboard/>}/>
//       <Route path="/admin/blog" element={<Blog/>}/>
//       <Route path="/admin/clients" element={<Clients/>}/>

//       <Route path="/admin/projects" element={<Projects/>}/>
//       <Route path="/admin/gallery" element={<Gallery/>}/>
//       <Route path="/admin/team" element={<Team/>}/>
//      </Routes>
//         <main className="flex-1 p-4 sm:p-6 lg:p-8">
//         <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// };

// export default AdminLayout;


import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-background">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;
