import type { Localized } from '@/lib/mock'

/** Short, class-specific pre-session pack — unlocked after signup. */
export type ClassBriefing = {
  arrive_by: Localized
  meeting_point: Localized
  wear_bring: Localized
  what_you_do: Localized[]
  emergency: Localized
  if_cannot_come: Localized
}

export const BRIEFINGS: Record<string, ClassBriefing> = {
  'a1111111-1111-4111-8111-111111111111': {
    arrive_by: {
      en: 'Arrive by 9:45 for a 10:00 start.',
      'zh-Hant': '請於 9:45 前到達（10:00 開始）。',
      'zh-Hans': '请于 9:45 前到达（10:00 开始）。',
    },
    meeting_point: {
      en: 'Wan Chai — exact floor and door code are in your confirmation email after HandsOn booking. Love 21 staff will meet you at reception.',
      'zh-Hant': '灣仔——HandsOn 報名後電郵會有樓層與門禁。Love 21 職員會在接待處接你。',
      'zh-Hans': '湾仔——HandsOn 报名后电邮会有楼层与门禁。Love 21 职员会在接待处接你。',
    },
    wear_bring: {
      en: 'Sports clothing and trainers. Water bottle. Tie long hair back.',
      'zh-Hant': '運動服與運動鞋、水壺；長髮請束起。',
      'zh-Hans': '运动服与运动鞋、水壶；长发请束起。',
    },
    what_you_do: [
      {
        en: 'Warm up and dance with the group — you are an active helper, not a spectator.',
        'zh-Hant': '與學員一起熱身、跳舞——你是主動幫手，不是旁觀。',
        'zh-Hans': '与学员一起热身、跳舞——你是主动帮手，不是旁观。',
      },
      {
        en: 'Help a small subgroup practise moves when the instructor is with others.',
        'zh-Hant': '教練照顧其他學員時，協助小組練習動作。',
        'zh-Hans': '教练照顾其他学员时，协助小组练习动作。',
      },
      {
        en: 'Keep energy kind and encouraging throughout.',
        'zh-Hant': '全程保持友善、鼓勵的氣氛。',
        'zh-Hans': '全程保持友善、鼓励的气氛。',
      },
    ],
    emergency: {
      en: 'In an emergency dial 999. Tell on-site staff immediately. Day-of Love 21 contact will be confirmed before your session (placeholder until staff verify).',
      'zh-Hant': '緊急情況請打 999，並立即告知現場職員。當日 Love 21 聯絡稍後確認。',
      'zh-Hans': '紧急情况请打 999，并立即告知现场职员。当日 Love 21 联络稍后确认。',
    },
    if_cannot_come: {
      en: 'Email as soon as you know — the class only has one helper spot.',
      'zh-Hant': '若不能出席請盡早電郵——本班通常只有一個助理名額。',
      'zh-Hans': '若不能出席请尽早电邮——本班通常只有一个助理名额。',
    },
  },
  'a2222222-2222-4222-8222-222222222222': {
    arrive_by: {
      en: 'Arrive by 13:45 for a 14:00 start.',
      'zh-Hant': '請於 13:45 前到達（14:00 開始）。',
      'zh-Hans': '请于 13:45 前到达（14:00 开始）。',
    },
    meeting_point: {
      en: 'Wan Chai studio — full address after HandsOn signup. Meet at the entrance; look for the Love 21 sign.',
      'zh-Hant': '灣仔工作室——HandsOn 報名後提供完整地址。在入口會合，留意 Love 21 指示。',
      'zh-Hans': '湾仔工作室——HandsOn 报名后提供完整地址。在入口会合，留意 Love 21 指示。',
    },
    wear_bring: {
      en: 'Clothes that can get paint on them. Closed-toe shoes. Optional apron.',
      'zh-Hant': '可沾顏料的衣服、包趾鞋；可自備圍裙。',
      'zh-Hans': '可沾颜料的衣服、包趾鞋；可自备围裙。',
    },
    what_you_do: [
      {
        en: 'Help set out paper, paints, and brushes before members arrive.',
        'zh-Hant': '學員到達前協助擺放紙張、顏料與畫筆。',
        'zh-Hans': '学员到达前协助摆放纸张、颜料与画笔。',
      },
      {
        en: 'Sit with members, create alongside them, and cheer finished pieces.',
        'zh-Hant': '與學員同桌創作，並為完成作品打氣。',
        'zh-Hans': '与学员同桌创作，并为完成作品加油。',
      },
      {
        en: 'Help with tidy-up so the next class starts clean.',
        'zh-Hant': '協助收拾，讓下一班可以清潔開始。',
        'zh-Hans': '协助收拾，让下一班可以清洁开始。',
      },
    ],
    emergency: {
      en: 'Dial 999 in an emergency. Alert the instructor first for any injury or distress.',
      'zh-Hant': '緊急請打 999。如有受傷或不適，先告知導師。',
      'zh-Hans': '紧急请打 999。如有受伤或不适，先告知导师。',
    },
    if_cannot_come: {
      en: 'Message early — art sessions need table helpers to run smoothly.',
      'zh-Hant': '請提早通知——藝術班需要桌邊幫手才能順利進行。',
      'zh-Hans': '请提早通知——艺术班需要桌边帮手才能顺利进行。',
    },
  },
  'a3333333-3333-4333-8333-333333333333': {
    arrive_by: {
      en: 'Arrive by 15:45 for a 16:00 start.',
      'zh-Hant': '請於 15:45 前到達（16:00 開始）。',
      'zh-Hans': '请于 15:45 前到达（16:00 开始）。',
    },
    meeting_point: {
      en: 'Wan Chai sports hall entrance — coaches will badge you in.',
      'zh-Hant': '灣仔體育館入口——教練會為你登記入場。',
      'zh-Hans': '湾仔体育馆入口——教练会为你登记入场。',
    },
    wear_bring: {
      en: 'Sports kit, grip socks if you have them, water. No jewellery that can catch.',
      'zh-Hant': '運動服裝、防滑襪（如有）、水；避免易勾纏飾物。',
      'zh-Hans': '运动服装、防滑袜（如有）、水；避免易勾缠饰物。',
    },
    what_you_do: [
      {
        en: 'Spot safely beside the trampoline — stay close, stay focused.',
        'zh-Hant': '在彈床旁安全守護——保持專注、靠近。',
        'zh-Hans': '在弹床旁安全守护——保持专注、靠近。',
      },
      {
        en: 'Cheer turns and help members wait their turn kindly.',
        'zh-Hant': '為輪次打氣，友善協助學員排隊。',
        'zh-Hans': '为轮次加油，友善协助学员排队。',
      },
      {
        en: 'Join warm-ups — you are part of the session.',
        'zh-Hant': '一起熱身——你是課堂的一員。',
        'zh-Hans': '一起热身——你是课堂的一员。',
      },
    ],
    emergency: {
      en: 'Dial 999 for emergencies. Coaches lead first aid — follow their instructions.',
      'zh-Hant': '緊急打 999。急救由教練主導——請跟從指示。',
      'zh-Hans': '紧急打 999。急救由教练主导——请跟从指示。',
    },
    if_cannot_come: {
      en: 'Tell us same day if you must cancel — spotting needs coverage.',
      'zh-Hant': '若需取消請即日通知——守護位置需要有人頂替。',
      'zh-Hans': '若需取消请即日通知——守护位置需要有人顶替。',
    },
  },
  'a4444444-4444-4444-8444-444444444444': {
    arrive_by: {
      en: 'Arrive by 10:45 for an 11:00 start.',
      'zh-Hant': '請於 10:45 前到達（11:00 開始）。',
      'zh-Hans': '请于 10:45 前到达（11:00 开始）。',
    },
    meeting_point: {
      en: 'Wan Chai teaching kitchen — check in at the front desk.',
      'zh-Hant': '灣仔教學廚房——請先到前台登記。',
      'zh-Hans': '湾仔教学厨房——请先到前台登记。',
    },
    wear_bring: {
      en: 'Closed-toe shoes, hair tied, no strong perfume. We provide aprons.',
      'zh-Hant': '包趾鞋、束髮、勿噴濃香水；圍裙現場提供。',
      'zh-Hans': '包趾鞋、束发、勿喷浓香水；围裙现场提供。',
    },
    what_you_do: [
      {
        en: 'Prep ingredients side-by-side with members.',
        'zh-Hant': '與學員並肩預備食材。',
        'zh-Hans': '与学员并肩预备食材。',
      },
      {
        en: 'Plate colourful meals together and share lunch at the end.',
        'zh-Hant': '一起擺盤，結束時共享午餐。',
        'zh-Hans': '一起摆盘，结束时共享午餐。',
      },
      {
        en: 'Help wipe surfaces and store leftovers safely.',
        'zh-Hant': '協助擦拭枱面並妥善存放剩菜。',
        'zh-Hans': '协助擦拭台面并妥善存放剩菜。',
      },
    ],
    emergency: {
      en: 'Dial 999 if needed. Report cuts or allergies to kitchen staff immediately.',
      'zh-Hant': '需要時打 999。割傷或過敏請即告知廚房職員。',
      'zh-Hans': '需要时打 999。割伤或过敏请即告知厨房职员。',
    },
    if_cannot_come: {
      en: 'Cancel early so food prep quantities can be adjusted.',
      'zh-Hant': '請提早取消，以便調整備料分量。',
      'zh-Hans': '请提早取消，以便调整备料分量。',
    },
  },
}

const BRIEFING_ALIASES: Record<string, string> = {
  'kpop-dance': 'a1111111-1111-4111-8111-111111111111',
  'mix-media-art': 'a2222222-2222-4222-8222-222222222222',
  'trampoline-assist': 'a3333333-3333-4333-8333-333333333333',
  'nutrition-plating': 'a4444444-4444-4444-8444-444444444444',
}

export function getBriefing(opportunityId: string): ClassBriefing | undefined {
  return BRIEFINGS[opportunityId] ?? BRIEFINGS[BRIEFING_ALIASES[opportunityId]]
}
