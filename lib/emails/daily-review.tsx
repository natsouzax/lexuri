import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface Props {
  cardsDue: number
  reviewUrl: string
}

export default function DailyReviewEmail({ cardsDue, reviewUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Você tem {cardsDue} {cardsDue === 1 ? 'flashcard' : 'flashcards'} para revisar hoje no Verbly</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={logo}>Verbly</Text>
          <Hr style={hr} />
          <Text style={heading}>
            {cardsDue === 1
              ? 'Você tem 1 flashcard para revisar hoje.'
              : `Você tem ${cardsDue} flashcards para revisar hoje.`}
          </Text>
          <Text style={paragraph}>
            O algoritmo de repetição espaçada selecionou esses cards no momento ideal para
            a sua memória de longo prazo. Revisar agora leva menos de 5 minutos.
          </Text>
          <Section style={btnSection}>
            <Button href={reviewUrl} style={button}>
              Revisar agora →
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Verbly · Aprendizado de inglês com chunk-first analysis
            <br />
            Para parar de receber lembretes, acesse Configurações → Perfil.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f5f0e8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  margin: '40px auto',
  padding: '40px 32px',
  maxWidth: '480px',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  border: '1px solid #e8e0d0',
}

const logo = {
  fontFamily: 'Georgia, serif',
  fontWeight: '900' as const,
  fontSize: '20px',
  color: '#18211d',
  margin: '0 0 4px',
}

const heading = {
  fontSize: '20px',
  fontWeight: '700' as const,
  color: '#18211d',
  margin: '20px 0 12px',
  lineHeight: '1.35',
}

const paragraph = {
  fontSize: '15px',
  color: '#5c6b5e',
  lineHeight: '1.65',
  margin: '0 0 24px',
}

const btnSection = {
  textAlign: 'center' as const,
  margin: '0 0 28px',
}

const button = {
  backgroundColor: '#c86f4a',
  color: '#ffffff',
  padding: '13px 28px',
  borderRadius: '10px',
  fontWeight: '700' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}

const hr = {
  borderColor: '#e8e0d0',
  margin: '0 0 20px',
}

const footer = {
  fontSize: '12px',
  color: '#9caa9e',
  lineHeight: '1.6',
  margin: '0',
}
