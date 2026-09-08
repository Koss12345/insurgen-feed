export interface Review {
  name: string;
  text: string;
  type: string;
}

// Placeholder testimonials — swap for real client feedback before launch.
// Deliberately generic (no surnames, no invented numbers/claims) so they
// don't misrepresent anyone while the site has no real reviews yet.
export const REVIEWS: Review[] = [
  {
    name: "Мария К.",
    type: "КАСКО",
    text: "Сравнила несколько предложений за пять минут, не пришлось никуда звонить самой. Заявку взяли в работу в тот же день.",
  },
  {
    name: "Игорь П.",
    type: "ОСАГО",
    text: "Понравилось, что сразу видно, из чего складывается цена, а не просто одна цифра. Оформили быстро.",
  },
  {
    name: "Светлана В.",
    type: "Путешествия",
    text: "Оформляла страховку перед поездкой в последний момент — успела за один вечер, всё понятно объяснили по телефону.",
  },
];
