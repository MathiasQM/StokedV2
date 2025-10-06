import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
dayjs.extend(isSameOrAfter)
export default defineNuxtPlugin(() => ({ provide: { dayjs } }))
