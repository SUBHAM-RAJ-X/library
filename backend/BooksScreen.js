import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function BooksScreen() {
  const [books, setBooks] = useState([])

  useEffect(() => {
    fetchBooks()
  }, [])

  async function fetchBooks() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
    } else {
      setBooks(data)
    }
  }

  return (
    <>
      {books.map((book) => (
        <div key={book.id}>
          <h3>{book.title}</h3>
          <p>{book.author}</p>
        </div>
      ))}
    </>
  )
}
