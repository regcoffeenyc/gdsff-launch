import PageHero from '../components/PageHero'

export default function GlossaryPage({ copy }) {
  const georgian = copy.locale === 'ka-GE'
  return <PageHero eyebrow="GDSFF" title={georgian ? 'ტერმინთა ლექსიკონი' : 'Glossary'} text={georgian ? 'სპორტული სროლისა და ფუნქციური ფიტნესის ძირითადი ტერმინები.' : 'Key terms used in dynamic shooting and functional fitness.'} highlights={[]} label="" />
}
