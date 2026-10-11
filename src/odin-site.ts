/** Links into odin-labs.ai. Product names and one-line descriptions follow the live product pages. */
export const odinSite = 'https://odin-labs.ai/';
export const odinPages = {
  products: `${odinSite}products/`,
  contact: `${odinSite}contact/`,
  trust: `${odinSite}trust/`,
  research: `${odinSite}research/`,
} as const;

export type OdinProductId = 'gateway' | 'harness' | 'command-center' | 'odin-next';
export const odinProducts: Record<OdinProductId, { name: string; url: string; contact: string }> = {
  gateway: { name: 'AI Gateway', url: `${odinSite}products/gateway/`, contact: `${odinPages.contact}#product-gateway` },
  harness: { name: 'Harness', url: `${odinSite}products/harness/`, contact: `${odinPages.contact}#product-harness` },
  'command-center': { name: 'Command Center', url: `${odinSite}products/command-center/`, contact: `${odinPages.contact}#product-command-center` },
  'odin-next': { name: 'Odin Next', url: `${odinSite}products/odin-next/`, contact: `${odinPages.contact}#product-odin-next` },
};

/** The first time a page links the Harness product, separate it from the discipline these docs teach. */
export const harnessDistinction = 'Harness engineering is the discipline these docs teach. Odin Harness is Odin’s product for it: work orders state the objective, scope and definition of done; action guards run as code before a tool acts; and a recorded review comes before work is reported as done.';
