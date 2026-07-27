'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function AdminPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  const ADMIN_PASSWORD = 'admin2026'

  useEffect(() => {
    if (authenticated) fetchPosts()
  }, [authenticated, filter])

  async function fetchPosts() {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select(`*, diseases ( primary_name, categories ( name ) ), post_tags ( tags ( name ) )`)
        .order('created_at', { ascending: false })

      if (filter !== 'all') query = query.eq('status', filter)

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(postId, newStatus) {
    const { error } = await supabase
      .from('posts')
      .update({ status: newStatus, approved_at: newStatus === 'approved' ? new Date().toISOString() : null })
      .eq('id', postId)

    if (error) {
      alert('エラーが発生しました')
    } else {
      fetchPosts()
    }
  }

  async function deletePost(postId) {
    if (!confirm('本当にこの投稿を削除しますか？')) return
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      alert('エラーが発生しました')
    } else {
      fetchPosts()
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
          <h2 className="text-lg font-bold text-center mb-4">管理者ログイン</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            if (password === ADMIN_PASSWORD) setAuthenticated(true)
            else alert('パスワードが間違っています')
          }}>
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700">
              ログイン
            </button>
          </form>
        </div>
      </div>
    )
  }

  const statusLabel = { pending: '承認待ち', approved: '承認済み', rejected: '却下' }
  const statusColor = { pending: 'bg-yellow-400', approved: 'bg-green-500', rejected: 'bg-slate-400' }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">管理画面</h1>
          <Link href="/" className="text-teal-600 text-sm">サイトに戻る</Link>
        </div>

        <div className="bg-white p-3 rounded-xl mb-4 flex gap-2 flex-wrap border border-slate-200">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                filter === f ? 'bg-teal-600 text-white
