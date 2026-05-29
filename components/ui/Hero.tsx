interface Props {
  title: string
  subtitle: string
  body: string
}

export default function Hero({ title, subtitle, body }: Props) {
  return (
    <div className="hero">
      <h1 className="hero-title">{title}</h1>
      <p className="hero-subtitle">{subtitle}</p>
      <p className="hero-body">{body}</p>
    </div>
  )
}
