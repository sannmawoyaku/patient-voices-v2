'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, PlusCircle, AlertTriangle, Heart, Flag, MessageSquare, Check, Tag, Settings } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [likedPosts, setLikedPosts] = useState([])

  useEffect(() => {
    fetchTags()
    fetchPosts()
    const stored = localStorage.getItem('likedPosts')
    if (stored) setLikedPosts(JSON.parse(stored))
  }, [])

  async function fetchTags() {
    const { data } = await supabase.from('tags').select('*').order('display_order')
    setTags(data || [])
  }

  async function fetchPosts() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          diseases ( primary_name, synonyms, categories ( name ) ),
          post_tags ( tags ( id, name ) )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLike(postId) {
    if (likedPosts.includes(postId)) return
    const post = posts.find(p => p.id === postId)
    const newLikes = (post.likes || 0) + 1

    const { error } = await supabase
      .from('posts')
      .update({ likes: newLikes })
      .eq('id', postId)

    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p))
      const updated = [...likedPosts, postId]
      setLikedPosts(updated)
      localStorage.setItem('likedPosts', JSON.stringify(updated))
    }
  }

  async function handleReport(postId) {
    const reason = prompt('通報理由を教えてください（任意）')
    const { error } = await supabase.from('reports').insert([{ post_id: postId, reason: reason || null }])
    if (!error) alert('通報を受け付けました。ご協力ありがとうございます。')
  }

  const filteredPosts = posts.filter(post => {
    if (selectedTag) {
      const postTagNames = (post.post_tags || []).map(pt => pt.tags?.name)
      if (!postTagNames.includes(selectedTag)) return false
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const diseaseName = post.diseases?.primary_name?.toLowerCase() || ''
      const synonyms = (post.diseases?.synonyms || []).join(' ').toLowerCase()
      const trouble = post.trouble?.toLowerCase() || ''
      const hack = post.hack?.toLowerCase() || ''
      const message = post.message?.toLowerCase() || ''

      return diseaseName.includes(term) || synonyms.includes(term) ||
             trouble.includes(term) || hack.includes(term) || message.includes(term)
    }

    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="bg-teal-600 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wider">患者の声</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/post" className="bg-white text-teal-600 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 hover:bg-teal-50 transition-colors">
              <PlusCircle className="w-4 h-4" />
              体験を投稿
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
            <input
              type="text"
              placeholder="病名や悩み（例：味覚障害、旅行）で検索..."
              className="w-full outline-none text-slate-700 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedTag === '' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              すべて
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.name)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedTag === tag.name ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center py-10 text-slate-400">読み込み中...</p>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white p-10 rounded-xl text-center text-slate-500 border border-slate-100">
              <p>該当する投稿がまだありません。</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-full text-sm">
                        {post.diseases?.primary_name || '病名未記載'}
                      </span>
                      <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded-md">
                        {post.standpoint}{post.stage ? ` / ${post.stage}` : ''}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(post.created_at).toLocaleDateString('ja-JP')}
                    </div>
                  </div>

                  {post.post_tags && post.post_tags.length > 0 && (
                    <div className="px-5 pt-3 flex flex-wrap gap-2">
                      {post.post_tags.map(pt => (
                        <span key={pt.tags?.id} className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                          <Tag className="w-3 h-3" /> {pt.tags?.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-orange-400" /> 直面した困りごと
                      </h3>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.trouble}</p>
                    </div>

                    {post.hack && (
                      <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                        <h3 className="text-sm font-bold text-teal-700 mb-2 flex items-center gap-1">
                          <Check className="w-4 h-4" /> やってみて良かった工夫
                        </h3>
                        <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{post.hack}</p>
                      </div>
                    )}

                    {post.message && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h3 className="text-sm font-bold text-orange-700 mb-1 flex items-center gap-1">
                          <Heart className="w-4 h-4" /> 同じ境遇の人へ
                        </h3>
                        <p className="text-slate-700 italic leading-relaxed whitespace-pre-wrap">{post.message}</p>
                      </div>
                    )}

                    <div className="text-xs text-slate-400 pt-1">
                      投稿者: {post.nickname || '匿名'}
                      {post.age_range && ` / ${post.age_range}`}
                      {post.gender && ` / ${post.gender}`}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-50 flex justify-between items-center bg-white">
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={likedPosts.includes(post.id)}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                        likedPosts.includes(post.id) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts.includes(post.id) ? 'fill-rose-500' : ''}`} />
                      役に立った ({post.likes || 0})
                    </button>
                    <button
                      onClick={() => handleReport(post.id)}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <Flag className="w-3 h-3" /> 通報する
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
