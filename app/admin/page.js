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
                filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-600'
              }`}
            >
              {f === 'all' ? '全て' : statusLabel[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-400">読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center text-slate-500 border border-slate-100">該当する投稿がありません</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${statusColor[post.status]}`}>
                    {statusLabel[post.status]}
                  </span>
                  {post.diseases?.categories && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{post.diseases.categories.name}</span>
                  )}
                  <span className="text-sm font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">{post.diseases?.primary_name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{new Date(post.created_at).toLocaleString('ja-JP')}</span>
                </div>

                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.post_tags.map((pt, i) => (
                      <span key={i} className="text-xs bg-slate-50 border px-2 py-0.5 rounded">{pt.tags?.name}</span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-3 text-sm">
                  <p><strong className="text-orange-600">困りごと：</strong>{post.trouble}</p>
                  {post.hack && <p><strong className="text-teal-600">工夫：</strong>{post.hack}</p>}
                  {post.message && <p><strong className="text-rose-600">一言：</strong>{post.message}</p>}
                </div>

                <div className="text-xs text-slate-500 mb-3 border-t pt-2">
                  投稿者: {post.nickname} / {post.standpoint} {post.stage && `/ ${post.stage}`}
                  {post.email && ` / ${post.email}`}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {post.status !== 'approved' && (
                    <button onClick={() => updateStatus(post.id, 'approved')} className="bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-600">承認</button>
                  )}
                  {post.status !== 'rejected' && (
                    <button onClick={() => updateStatus(post.id, 'rejected')} className="bg-slate-400 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-slate-500">却下</button>
                  )}
                  <button onClick={() => deletePost(post.id)} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-600">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}'use client'

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
                filter === f ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-600 border-teal-600'
              }`}
            >
              {f === 'all' ? '全て' : statusLabel[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-400">読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center text-slate-500 border border-slate-100">該当する投稿がありません</div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex flex-wrap gap-2 items-center mb-3">
                  <span className={`text-white text-xs font-bold px-3 py-1 rounded-full ${statusColor[post.status]}`}>
                    {statusLabel[post.status]}
                  </span>
                  {post.diseases?.categories && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{post.diseases.categories.name}</span>
                  )}
                  <span className="text-sm font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">{post.diseases?.primary_name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{new Date(post.created_at).toLocaleString('ja-JP')}</span>
                </div>

                {post.post_tags && post.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.post_tags.map((pt, i) => (
                      <span key={i} className="text-xs bg-slate-50 border px-2 py-0.5 rounded">{pt.tags?.name}</span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 mb-3 text-sm">
                  <p><strong className="text-orange-600">困りごと：</strong>{post.trouble}</p>
                  {post.hack && <p><strong className="text-teal-600">工夫：</strong>{post.hack}</p>}
                  {post.message && <p><strong className="text-rose-600">一言：</strong>{post.message}</p>}
                </div>

                <div className="text-xs text-slate-500 mb-3 border-t pt-2">
                  投稿者: {post.nickname} / {post.standpoint} {post.stage && `/ ${post.stage}`}
                  {post.email && ` / ${post.email}`}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {post.status !== 'approved' && (
                    <button onClick={() => updateStatus(post.id, 'approved')} className="bg-green-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-600">承認</button>
                  )}
                  {post.status !== 'rejected' && (
                    <button onClick={() => updateStatus(post.id, 'rejected')} className="bg-slate-400 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-slate-500">却下</button>
                  )}
                  <button onClick={() => deletePost(post.id)} className="bg-red-500 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-red-600">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
