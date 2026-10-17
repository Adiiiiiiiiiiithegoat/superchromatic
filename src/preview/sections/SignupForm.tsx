import { CheckCircle2 } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignupForm() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [updates, setUpdates] = useState(true)
  const [plan, setPlan] = useState('starter')
  const [agreed, setAgreed] = useState(false)
  const [done, setDone] = useState(false)
  const emailError = touched && !EMAIL.test(email) ? 'Enter a valid email, like you@college.edu' : null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (EMAIL.test(email) && agreed) setDone(true)
  }

  return (
    <form onSubmit={submit} noValidate className="pv-card p-5 @xl:p-6" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="pv-h text-xl font-bold">Create your club space</h3>
      <p className="pv-muted mt-1 text-sm">Free for clubs under 100 members. No card needed.</p>

      {done ? (
        <div className="pv-alert mt-5" role="status">
          <CheckCircle2 aria-hidden className="size-5 shrink-0" style={{ color: 'var(--success)' }} />
          <div>
            <p className="font-semibold">You’re in!</p>
            <p className="pv-muted text-sm">Check {email} for your invite link.</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 @xl:grid-cols-2">
          <div>
            <label className="pv-label" htmlFor={`${id}-name`}>Club name</label>
            <input id={`${id}-name`} className="pv-input" placeholder="Robotics Society" />
          </div>
          <div>
            <label className="pv-label" htmlFor={`${id}-email`}>Email</label>
            <input
              id={`${id}-email`}
              type="email"
              className="pv-input"
              placeholder="you@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? `${id}-email-err` : undefined}
            />
            {emailError && <p id={`${id}-email-err`} className="pv-error">{emailError}</p>}
          </div>
          <div className="@xl:col-span-2">
            <label className="pv-label" htmlFor={`${id}-type`}>Club type</label>
            <select id={`${id}-type`} className="pv-input" defaultValue="tech">
              <option value="tech">Technical</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="entrepreneurship">Entrepreneurship</option>
            </select>
          </div>
          <div className="@xl:col-span-2">
            <label className="pv-label" htmlFor={`${id}-about`}>What do you run?</label>
            <textarea id={`${id}-about`} className="pv-input min-h-20" rows={3} placeholder="Weekly workshops, a hackathon each semester…" />
          </div>
          <fieldset className="@xl:col-span-2">
            <legend className="pv-label">Plan</legend>
            <div className="flex flex-wrap gap-4 text-sm">
              {['starter', 'club', 'campus'].map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 capitalize">
                  <input type="radio" name={`${id}-plan`} value={p} checked={plan === p} onChange={() => setPlan(p)} className="pv-check" />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-center justify-between gap-3 @xl:col-span-2">
            <span id={`${id}-updates`} className="text-sm">Send me product updates</span>
            <button type="button" role="switch" aria-checked={updates} aria-labelledby={`${id}-updates`} className="pv-switch" onClick={() => setUpdates(!updates)} />
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-sm @xl:col-span-2">
            <input type="checkbox" className="pv-check mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the <span className="underline underline-offset-2">terms</span> and the club data policy.
            </span>
          </label>
          {touched && !agreed && <p className="pv-error -mt-2 @xl:col-span-2">Please accept the terms to continue.</p>}
          <button type="submit" className="pv-btn pv-btn-primary @xl:col-span-2">Create space</button>
        </div>
      )}
    </form>
  )
}
