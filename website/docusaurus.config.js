const repository = process.env.GITHUB_REPOSITORY || 'hieutran21198/software-engineering';
const [owner, name] = (repository || 'local/software-engineering').split('/');
const config = {
  title: 'Software Engineering',
  tagline: 'Knowledge, templates, and tools for software architecture',
  url: process.env.SITE_URL || (repository ? `https://${owner}.github.io` : 'http://localhost:3000'),
  baseUrl: process.env.SITE_BASE_URL || (repository && name !== `${owner}.github.io` ? `/${name}/` : '/'),
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {format: 'md', mermaid: true, hooks: {onBrokenMarkdownLinks: 'throw'}},
  themes: ['@docusaurus/theme-mermaid'],
  presets: [['classic', {
    docs: {
      path: '.docs',
      routeBasePath: '/',
      sidebarPath: './sidebars.js',
      breadcrumbs: false,
    },
    blog: false,
    theme: {customCss: './src/css/custom.css'},
  }]],
  themeConfig: {
    navbar: {title: 'Software Engineering', items: [
      {to: '/', label: 'Overview', position: 'left'},
      {to: '/src/archs/artifact-driven/', label: 'Artifact-Driven Development', position: 'left'},
      ...(repository ? [{href: `https://github.com/${repository}`, label: 'GitHub', position: 'right'}] : []),
    ]},
    footer: {style: 'dark', copyright: 'Software Engineering — knowledge, templates, and seed files.'},
  },
};
export default config;
