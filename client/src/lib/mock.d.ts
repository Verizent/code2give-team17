export type Localized = Record<'en' | 'zh-Hant' | 'zh-Hans', string>

export type Activity = {
  id: string
  title: Localized
  date: Localized
  place: Localized
  category: Localized
  recruiting: boolean
  accent: 'teal' | 'pink' | 'yellow' | 'navy'
}
