const path = require("path");

module.exports = function (eleventyConfig, options) {
  // Define defaults for your plugin config
  const defaults = {
    metaKey: "meta",
    metaExtension: "meta",
  };

  // Combine defaults with user defined options
  const { metaKey, metaExtension } = {
    ...defaults,
    ...options,
  };

  eleventyConfig.addDataExtension(`${metaExtension}`, {
    parser: (contents, filePath) => {
      const metaName = path.parse(filePath).name;

      return JSON.parse(`{ "${metaName}": ${contents} }`);
    },
  });

  eleventyConfig.addFilter("metaSchema", function (data) {
    if (data.tags) {
      const { inputPath } = data.page;
      const { tags, [metaKey]: meta } = data;

      // data[tags[0]] -> data["pages"] -> pages.meta
      const schema = tags[0] && data[tags[0]] ? data[tags[0]] : false;

      if (schema) {
        const required = Object.keys(schema).filter((i) => schema[i].required);
        const metaKeys = meta && Object.keys(meta);

        // Check for all required
        const requiredKeys = [];
        for (req of required) {
          if (!metaKeys || !metaKeys.includes(req)) {
            requiredKeys.push(req);
          }
        }

        if (requiredKeys.length) {
          console.error(
            "\x1b[41m %s - Missing required %s keys: \033[1m%s \033[0m \x1b[0m",
            inputPath,
            metaKey,
            requiredKeys.join(", ")
          );
        }

        // Validate types
        const invalidKeys = [];
        for (key in meta) {
          if (schema[key]) {
            if (
              (schema[key].type !== "array" &&
                typeof meta[key] !== schema[key].type) ||
              (schema[key].type === "array" && !Array.isArray(meta[key]))
            ) {
              // Check type matches
              console.error(
                "\x1b[33m %s - Incorrect type for %s \033[1m`%s`\033[0m\x1b[33m, change to %s \x1b[0m",
                inputPath,
                metaKey,
                key,
                schema[key].type
              );
            }
          } else if (!schema[key]) {
            invalidKeys.push(key);
          }
        }

        // Warn for invalid keys
        if (invalidKeys.length) {
          console.error(
            "\x1b[36m %s - Invalid %s keys: \033[1m%s\033[0m \x1b[0m",
            inputPath,
            metaKey,
            invalidKeys.join(", ")
          );
        }

        // Check for misplaced keys (outside meta)
        const misplacedKeys = [];
        for (key in schema) {
          if (data[key]) {
            misplacedKeys.push(key);
          }
        }

        // Warn for misplaced keys
        if (misplacedKeys.length) {
          console.error(
            "\x1b[95m %s - Possibly misplaced %s keys: \033[1m%s\033[0m \x1b[0m",
            inputPath,
            metaKey,
            misplacedKeys.join(", ")
          );
        }
      }
    }
  });
};
