module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find source-map-loader rule
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) => rule.use && rule.use.find((use) => use.loader && use.loader.includes('source-map-loader'))
      );

      // If found, remove it to suppress source map warnings
      if (sourceMapRule) {
        webpackConfig.module.rules = webpackConfig.module.rules.filter(
          (rule) => rule !== sourceMapRule
        );
      }

      return webpackConfig;
    },
  },
}; 