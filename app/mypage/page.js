'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function MyPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const result = await supabase.auth.getUser()
    if (!result.data.user) {
      router.push('/login')
      return
    }
    setUser(result.data.user)
    setCheckingAuth(false)
    fetchMyPosts(result.data.user.id)
  }

  async function fetchMyPosts(userId) {
    setLoading(true)
    const result = await supabase
      .from('posts')
      .select('*, diseases ( primary_name, categories ( name ) )')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setPosts(result.data || [])
    setLoading(false)
  }

  async function handleDelete(postId) {
    if (!confirm('本当にこの投稿を削除しますか？')) return
    const result = await supabase.from('posts').delete().eq('id', postId)
    if (!result.error) {
      setPosts(posts.filter(p => p.id !== postId))
    } else {
      alert('削除に失敗しました')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const statusLabel = { pending: '承認待ち', approved: '公開中', rejected: '却下', hidden: '非表示（通報多数）' }

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">確認中...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-slate-700">マイページ</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700 underline">
            ログアウト
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <p className="text-sm text-slate-500">ログイン中のメールアドレス</p>
          <p className="font-bold text-slate-700">{user && user.email}</p>
        </div>

        <h2 className="text-lg font-bold text-slate-700 mb-3">あなたの投稿一覧</h2>

        {loading ? (
          <p className="text-center py-10 text-slate-400">読み込み中...</p>
        ) : posts.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center text-slate-500 border border-slate-100">
            まだ投稿がありません。
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full">
                      {post.diseases ? post.diseases.primary_name : '病名未記載'}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      {statusLabel[post.status] || post.status}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">{post.trouble}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(post.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
