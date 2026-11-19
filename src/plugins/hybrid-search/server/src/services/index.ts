import { getRuntime } from '../runtime';

const search = ({ strapi }: { strapi: any }) => ({
  search: (input: any) => getRuntime(strapi).search(input),
  similar: (input: any) => getRuntime(strapi).similar(input),
  reindex: (input: any) => getRuntime(strapi).reindex(input),
  status: () => getRuntime(strapi).status(),
});

export default {
  search,
};
