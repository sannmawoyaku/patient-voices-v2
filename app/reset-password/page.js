'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)

    const result = await supabase.auth.updateUser({ password })

    if (result.error) {
      setMessage('更新に失敗しました：' + result.error.message)
    } else {
      setDone(true)
      setMessage('パスワードを更新しました。')
      setTimeout(() => router.push('/mypage'), 2000)
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <MessageSquare className="w-6 h-6 text-teal-600" />
          <span className="text-lg font-bold text-slate-700">患者の声</span>
        </div>

        <h2 className="text-center font-bold text-slate-700 mb-6">新しいパスワードを設定</h2>

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">新しいパスワード</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-slate-500 mt-1">6文字以上で設定してください</p>
            </div>

            {message && (
              <div className={message.includes('失敗') ? 'p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200' : 'p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200'}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={submitting ? 'w-full py-3 rounded-xl font-bold bg-slate-200 text-slate-400' : 'w-full py-3 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white'}
            >
              {submitting ? '更新中...' : 'パスワードを更新する'}
            </button>
          </form>
        ) : (
          <div className="p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200 text-center">
            {message}<br />マイページに移動します...
          </div>
        )}
      </div>
    </div>
  )
}
