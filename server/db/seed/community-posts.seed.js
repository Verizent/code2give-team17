// Voices. Three approved so the tab and the Home strip have content, one pending so
// the moderation queue has something to demo on day one.
//
// `contact_email` is set on some rows deliberately: it is what the public projection
// test asserts never escapes. A seed with no emails would make that test pass for the
// wrong reason.

const communityPosts = [
  {
    author_name: "Rachel L.",
    relationship: "volunteer",
    story:
      "I came with my Morgan Stanley team expecting to help out for an afternoon. What I did not expect was how quickly the room stopped feeling like a volunteering shift and started feeling like a Saturday with friends. I have been back six times since, on my own.",
    contact_email: "rachel.example@example.com",
    consent_given: true,
    status: "approved",
    moderated_at: "2026-07-20T02:31:00.000Z",
  },
  {
    author_name: "Daniel W.",
    relationship: "volunteer",
    story:
      "Our firm ran a fitness session at the San Po Kong centre. I spent most of it being comprehensively beaten at bocce. The thing that stayed with me is how ordinary it all was — nobody was being inspiring at anybody, we were just playing.",
    contact_email: "daniel.example@example.com",
    consent_given: true,
    status: "approved",
    moderated_at: "2026-07-18T07:05:00.000Z",
  },
  {
    author_name: "Mrs Chan",
    relationship: "parent",
    story:
      "為人父母最難的，是不斷聽到孩子「不適合」參加這個那個。在 Love 21，沒有人問我的女兒能不能做到，他們只問她想不想試。這種分別，外人未必明白。",
    consent_given: true,
    status: "approved",
    moderated_at: "2026-07-22T09:40:00.000Z",
  },
  {
    author_name: "Priya S.",
    relationship: "supporter",
    story:
      "I have been donating for two years but only visited the centre last month. Seeing where the money actually goes changed how I talk about the charity to other people. I wanted to say so somewhere it might be read.",
    contact_email: "priya.example@example.com",
    consent_given: true,
    status: "pending",
  },
];

module.exports = { communityPosts };
