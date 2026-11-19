const config = {
  default: {
    embedGapMs: 40,
    similarThreshold: 0.9,
    types: {},
  },
  validator(value: { types?: unknown }) {
    if (value.types != null && (typeof value.types !== 'object' || Array.isArray(value.types))) {
      throw new Error('hybrid-search config.types must be an object of uid -> { fields }');
    }
  },
};

export default config;
