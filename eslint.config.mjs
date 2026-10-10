// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({ ignores: ['legacy-quipubox/**'] }, {
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }]
  }
})
