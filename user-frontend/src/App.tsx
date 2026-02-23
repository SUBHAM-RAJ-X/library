import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { supabase } from "./config/supabaseClient"

import MainLayout from "./layouts/MainLayout"
import Home from "./pages/Home"
import Books from "./pages/Books"
import BookDetail from "./pages/BookDetail"
import MyBooks from "./pages/MyBooks"
import Profile from "./pages/Profile"
import Login from "./pages/Login"
import Register from "./pages/Register"
import AuthLayout from "./layouts/AuthLayout"

function App() {
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        {/* AUTH ROUTES */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        {/* MAIN APP ROUTES WITH SIDEBAR LAYOUT */}
        <Route
          path="/*"
          element={
            <MainLayout user={user}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/books" element={<Books />} />
                <Route path="/books/:id" element={<BookDetail />} />
                <Route path="/my-books" element={<MyBooks />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App