interface Props {
  title: string
  subtitle: string
  body: string
}

export default function Hero({ title, subtitle, body }: Props) {
  return (
    <div className="app-hero">
      <p className="app-hero-subtitle">{subtitle}</p>
      <h1 className="app-hero-title">{title}</h1>
      <p className="app-hero-body">{body}</p>
    </div>
  )
}
