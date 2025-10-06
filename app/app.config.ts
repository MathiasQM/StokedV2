export default defineAppConfig({
  ui: {
    toast: {
      slots: {
        // wrapper: ``,
        root: 'rounded-[16px] shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[3px] bg-[rgba(185,185,185,0.39)] dark:bg-[rgba(93,93,93,0.39)] border border-transparent dark:border-black-600 margin-env-top',
        // title: string;
        // description: string;
        // icon: string;
        // avatar: string;
        // avatarSize: string;
        // actions: string;
        // progress: string;
        // close: string;
      },
    },
    icons: {
      loading: 'i-lucide-loader-circle',
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
    },
    colors: {
      primary: 'emerald',
      neutral: 'neutral',
      orange: 'orange',
    },
  },
  seo: {
    title: 'Striive',
    description: 'Manage your portfolio and get insights on your investments',
  },
})
