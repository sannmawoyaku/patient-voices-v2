'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setSubmitting(true)

    if (mode === 'signup') {
      const result = await supabase.auth.signUp({ email, password })
      if (result.error) {
        setMessage('登録に失敗しました：' + result.error.message)
      } else {
        setMessage('登録が完了しました。確認メールが届いていれば、リンクをクリックしてください。')
      }
    } else if (mode === 'login') {
      const result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) {
        setMessage('ログインに失敗しました：' + result.error.message)
      } else {
        router.push('/mypage')
      }
    } else if (mode === 'reset') {
      const result = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://patient-voices-v2.vercel.app/reset-password'
      })
      if (result.error) {
        setMessage('送信に失敗しました：' + result.error.message)
      } else {
        setMessage('パスワード再設定用のメールを送信しました。メールをご確認ください。')
      }
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

        {mode !== 'reset' && (
          <div className="flex mb-6 border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => { setMode('login'); setMessage('') }}
              className={mode === 'login' ? 'flex-1 py-2 text-sm font-bold bg-teal-600 text-white' : 'flex-1 py-2 text-sm font-bold bg-white text-slate-600'}
            >
              ログイン
            </button>
            <button
              onClick={() => { setMode('signup'); setMessage('') }}
              className={mode === 'signup' ? 'flex-1 py-2 text-sm font-bold bg-teal-600 text-white' : 'flex-1 py-2 text-sm font-bold bg-white text-slate-600'}
            >
              新規登録
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <h2 className="text-center font-bold text-slate-700 mb-6">パスワードの再設定</h2>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">メールアドレス</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">パスワード</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              {mode === 'signup' && (
                <p className="text-xs text-slate-500 mt-1">6文字以上で設定してください</p>
              )}
            </div>
          )}

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
            {submitting ? '処理中...' : (mode === 'login' ? 'ログイン' : mode === 'signup' ? '登録する' : '再設定メールを送る')}
          </button>
        </form>

        {mode === 'login' && (
          <div className="text-center mt-4">
            <button onClick={() => { setMode('reset'); setMessage('') }} className="text-sm text-slate-500 hover:underline">
              パスワードを忘れた方はこちら
            </button>
          </div>
        )}

        {mode === 'reset' && (
          <div className="text-center mt-4">
            <button onClick={() => { setMode('login'); setMessage('') }} className="text-sm text-slate-500 hover:underline">
              ログイン画面に戻る
            </button>
          </div>
        )}

        <div className="text-center mt-2">
          <Link href="/" className="text-sm text-teal-600 hover:underline">サイトに戻る</Link>
        </div>
      </div>
    </div>
  )
}
