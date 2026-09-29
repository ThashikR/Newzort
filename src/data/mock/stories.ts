/**
 * DEMO STORY CLUSTERS — development data only.
 *
 * Each cluster simulates the output of the backend pipeline: several articles
 * from different (fictional) publishers grouped into one event, plus the
 * structured AI analysis. Events are illustrative and are NOT real reporting.
 */
import type { Article, Entity, NewsSource, StoryCluster, StorySummary, TopicId } from '@/types/news';
import { hoursAgo } from '@/utils/time';

import { DEMO_SOURCES as S } from './sources';

type ArticleSpec = [source: NewsSource, headline: string, hoursAgo: number];

interface ClusterSpec extends Omit<StorySummary, 'headline'> {
  id: string;
  headline: string;
  category: TopicId;
  country: string | null;
  importance: number;
  readMinutes: number;
  quickRead?: boolean;
  articles: ArticleSpec[];
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

function build(spec: ClusterSpec): StoryCluster {
  const articles: Article[] = spec.articles.map(([source, headline, hrs], i) => ({
    id: `${spec.id}-a${i + 1}`,
    sourceId: source.id,
    headline,
    url: `${source.homepage}/${slug(headline)}`,
    publishedAt: hoursAgo(hrs),
  }));
  const times = spec.articles.map(([, , hrs]) => hrs);
  const sources = spec.articles.map(([s]) => s).filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);
  const analysis: StorySummary = {
    headline: spec.headline,
    summary: spec.summary,
    whatHappened: spec.whatHappened,
    keyPoints: spec.keyPoints,
    whyItMatters: spec.whyItMatters,
    background: spec.background,
    whatHappensNext: spec.whatHappensNext,
    topics: spec.topics,
    entities: spec.entities,
    confidence: spec.confidence,
  };

  return {
    clusterId: spec.id,
    canonicalHeadline: spec.headline,
    category: spec.category,
    country: spec.country,
    publishedAt: hoursAgo(Math.max(...times)),
    updatedAt: hoursAgo(Math.min(...times)),
    importanceScore: spec.importance,
    readMinutes: spec.readMinutes,
    isQuickRead: !!spec.quickRead,
    analysis,
    articles,
    sources,
    isDemo: true,
  };
}

const org = (name: string): Entity => ({ name, type: 'organization' });
const company = (name: string): Entity => ({ name, type: 'company' });
const country = (name: string): Entity => ({ name, type: 'country' });
const place = (name: string): Entity => ({ name, type: 'place' });

const SPECS: ClusterSpec[] = [
  {
    id: 'c-rbi-inflation',
    headline: 'RBI signals a cautious approach to inflation',
    category: 'economy',
    country: 'IN',
    importance: 90,
    readMinutes: 1.5,
    summary:
      'The Reserve Bank indicated it will keep a close watch on price pressures before changing its policy stance, citing food prices as the main risk.',
    whatHappened:
      "In its latest policy communication, the central bank said inflation has eased from recent highs but remains above its comfort level. Officials said they want more data on food prices before considering any change to interest rates.",
    keyPoints: [
      'Inflation has eased but is still above the central bank’s comfort level.',
      'Food prices, especially vegetables and pulses, are the main concern.',
      'The policy stance is unchanged for now.',
      'Future decisions will depend on upcoming inflation and growth data.',
    ],
    whyItMatters:
      'Interest-rate decisions affect loan EMIs, deposit returns, business borrowing and overall economic growth.',
    background:
      'Central banks raise or hold interest rates to cool inflation and cut them to support growth. Food makes up a large share of India’s consumer price index, so weather and harvests strongly influence inflation.',
    whatHappensNext:
      'All four sources point to the next inflation data release as the key input. None of them report a decision on rates beyond the current stance.',
    topics: ['economy', 'india', 'finance'],
    entities: [org('Reserve Bank of India'), country('India')],
    confidence: 'high',
    articles: [
      [S.meridian, 'RBI keeps a watchful eye on food inflation', 3],
      [S.globalWire, 'India’s central bank signals caution on price pressures', 4],
      [S.capitalLedger, 'RBI holds stance, says data will guide next move', 3.5],
      [S.marketReview, 'Rate outlook: RBI in no hurry, analysts say', 2],
    ],
  },
  {
    id: 'c-semiconductor-incentives',
    headline: 'India expands incentives for semiconductor manufacturing',
    category: 'technology',
    country: 'IN',
    importance: 84,
    readMinutes: 2,
    summary:
      'The government announced a wider incentive programme for chip manufacturing and assembly, aiming to attract more investment into domestic fabrication.',
    whatHappened:
      'The Centre said it will expand its semiconductor programme to cover more types of facilities, including chip packaging and testing units. The announcement was reported by three outlets, which agree on the expansion but differ slightly in emphasis.',
    keyPoints: [
      'The programme now covers packaging and testing units, not only fabrication plants.',
      'The aim is to attract more private investment into chipmaking in India.',
      'Officials linked the move to supply-chain resilience for electronics.',
      'Details on the total budget were not consistent across sources.',
    ],
    whyItMatters:
      'Semiconductors power phones, cars and data centres. Domestic production could create skilled jobs and reduce dependence on imports during global supply shocks.',
    background:
      'Global chip shortages in recent years disrupted car and electronics production worldwide. Several countries have since introduced subsidies to build local chip supply chains.',
    whatHappensNext:
      'Sources say companies will need to apply under the revised scheme; approvals and actual investment announcements would follow later.',
    topics: ['technology', 'india', 'business', 'geopolitics'],
    entities: [org('Government of India'), country('India'), place('Gujarat')],
    confidence: 'medium',
    articles: [
      [S.meridian, 'India announces new semiconductor incentives', 5],
      [S.bharatChronicle, 'Centre expands semiconductor programme', 6],
      [S.globalWire, 'India boosts semiconductor investment push', 5.5],
    ],
  },
  {
    id: 'c-ai-safety-testing',
    headline: 'Leading AI developers agree on shared safety-testing practices',
    category: 'ai',
    country: null,
    importance: 81,
    readMinutes: 2,
    summary:
      'A group of major AI companies agreed to common procedures for testing advanced models before release, including independent evaluations.',
    whatHappened:
      'Several large AI developers signed a voluntary agreement describing how they will test powerful AI systems for risks before public release. The agreement covers evaluations for misuse, security and reliability.',
    keyPoints: [
      'The agreement is voluntary and not legally binding.',
      'It includes testing before release and sharing some results with governments.',
      'Independent evaluators will be involved for the most capable models.',
      'Critics quoted in the reports said enforcement details remain unclear.',
    ],
    whyItMatters:
      'AI tools are spreading into work, education and public services. Common testing standards could make powerful systems safer and easier to compare.',
    background:
      'Governments have been debating how to regulate AI. Voluntary industry commitments have been used as an interim step while laws are drafted.',
    whatHappensNext:
      'The reports say signatories are expected to publish their first testing reports; how independent reviewers are chosen is still being decided.',
    topics: ['ai', 'technology', 'world'],
    entities: [org('AI developers'), org('AI safety institutes')],
    confidence: 'high',
    articles: [
      [S.globalWire, 'AI companies sign up to common safety tests', 7],
      [S.circuit, 'What the new AI testing pact does — and doesn’t — do', 5],
      [S.marketReview, 'Tech majors align on pre-release AI evaluations', 6],
    ],
  },
  {
    id: 'c-hospital-ransomware',
    headline: 'Hospital network restores systems after ransomware attack',
    category: 'cybersecurity',
    country: null,
    importance: 76,
    readMinutes: 1.5,
    summary:
      'A regional hospital network says core systems are back online after a ransomware attack forced it to postpone some non-urgent appointments.',
    whatHappened:
      'Hospitals in the network switched to paper records for several days after attackers encrypted parts of their IT systems. The operator says emergency care continued throughout and systems are now being restored.',
    keyPoints: [
      'Emergency services continued during the outage.',
      'Some non-urgent appointments were postponed.',
      'The operator is investigating whether patient data was accessed.',
      'Authorities have been informed.',
    ],
    whyItMatters:
      'Healthcare is a frequent ransomware target because downtime directly affects patients, which puts pressure on hospitals to recover quickly.',
    background:
      'Ransomware locks files until a payment is made. Many organisations now keep offline backups so they can recover without paying.',
    whatHappensNext:
      'The operator said a forensic review is under way. Whether patient data was exposed has not been confirmed by any source.',
    topics: ['cybersecurity', 'health', 'technology'],
    entities: [org('Regional hospital network')],
    confidence: 'medium',
    articles: [
      [S.secureLine, 'Hospital group recovering from ransomware incident', 8],
      [S.globalWire, 'Hospitals return to digital systems after cyberattack', 6],
      [S.circuit, 'Inside a hospital’s week on paper records', 4],
    ],
  },
  {
    id: 'c-vpn-flaw',
    headline: 'Critical flaw fixed in widely used VPN software',
    category: 'cybersecurity',
    country: null,
    importance: 72,
    readMinutes: 0.75,
    quickRead: true,
    summary:
      'A vendor released a patch for a serious vulnerability in its VPN gateway; organisations are urged to update promptly.',
    whatHappened:
      'Security researchers reported a flaw that could let attackers access corporate networks through an unpatched VPN device. The vendor has released a fix.',
    keyPoints: [
      'A patch is available now.',
      'Attackers could gain network access through unpatched devices.',
      'Security agencies recommend updating immediately.',
    ],
    whyItMatters: 'VPN gateways guard access to company networks, so flaws in them are high-value targets.',
    background: 'Remote-access devices have been a common entry point in recent large breaches.',
    whatHappensNext: null,
    topics: ['cybersecurity', 'technology', 'business'],
    entities: [org('VPN vendor'), org('Security researchers')],
    confidence: 'high',
    articles: [
      [S.secureLine, 'Patch now: critical VPN gateway flaw disclosed', 2],
      [S.circuit, 'VPN vendor fixes serious vulnerability', 1.5],
    ],
  },
  {
    id: 'c-g20-critical-minerals',
    headline: 'G20 ministers agree framework for critical mineral supply chains',
    category: 'geopolitics',
    country: null,
    importance: 78,
    readMinutes: 2,
    summary:
      'Trade ministers agreed on shared principles for securing supplies of minerals used in batteries and electronics, with India among the backers.',
    whatHappened:
      'At a ministerial meeting, member countries adopted a non-binding framework to diversify sources of minerals like lithium and cobalt and to improve transparency in their trade.',
    keyPoints: [
      'The framework is non-binding.',
      'It focuses on diversifying supply and processing locations.',
      'India supported provisions on technology sharing.',
      'Environmental and labour standards are included in general terms.',
    ],
    whyItMatters:
      'Critical minerals are essential for electric vehicles, renewable energy and electronics. Supply concentrated in few countries creates price and security risks.',
    background:
      'Processing of several critical minerals is highly concentrated globally, which has prompted many countries to seek alternative suppliers.',
    whatHappensNext:
      'Sources say working groups will draft implementation steps; no timeline was given in the reports.',
    topics: ['geopolitics', 'world', 'economy', 'india'],
    entities: [org('G20'), country('India')],
    confidence: 'high',
    articles: [
      [S.globalWire, 'G20 trade ministers back critical minerals framework', 9],
      [S.eastAsiaObserver, 'Minerals pact aims to spread supply risk', 8],
      [S.policyWatch, 'India pushes technology sharing in G20 minerals deal', 7],
    ],
  },
  {
    id: 'c-monsoon-withdrawal',
    headline: 'Monsoon withdrawal running later than usual, says weather office',
    category: 'environment',
    country: 'IN',
    importance: 70,
    readMinutes: 1,
    summary:
      'The monsoon’s retreat from north-west India is behind the typical schedule, with more rain expected in parts of central and southern India this week.',
    whatHappened:
      'The weather department’s latest update said conditions for monsoon withdrawal have not yet been met across several regions and forecast further rain.',
    keyPoints: [
      'Withdrawal is behind the usual timeline.',
      'More rain is forecast in central and southern regions this week.',
      'Late rain can help reservoir levels but may damage standing crops.',
    ],
    whyItMatters:
      'The monsoon drives farm output, food prices and water supply. Timing matters for harvests now in the field.',
    background:
      'The south-west monsoon usually begins withdrawing from north-west India in September and exits the country by mid-October.',
    whatHappensNext:
      'The weather office will issue updated withdrawal forecasts; sources do not predict a specific date.',
    topics: ['environment', 'india', 'economy'],
    entities: [org('India Meteorological Department'), country('India')],
    confidence: 'high',
    articles: [
      [S.bharatChronicle, 'Monsoon lingers as withdrawal is delayed', 10],
      [S.greenPlanet, 'Late monsoon retreat: what it means for farmers', 8],
    ],
  },
  {
    id: 'c-isro-crew-test',
    headline: 'ISRO completes key safety test for crewed spaceflight programme',
    category: 'space',
    country: 'IN',
    importance: 74,
    readMinutes: 1.5,
    summary:
      'India’s space agency reported a successful test of a crew-escape system, a step toward its first human spaceflight.',
    whatHappened:
      'ISRO said the test verified that the escape system can safely pull a crew module away from the rocket in an emergency. Data from the test is being analysed.',
    keyPoints: [
      'The test checked the crew-escape system.',
      'ISRO described the result as successful.',
      'More uncrewed tests are planned before a crewed flight.',
    ],
    whyItMatters:
      'Human spaceflight is a major technological milestone and supports India’s growing space industry.',
    background:
      'Only a few countries have independently launched humans into orbit. Crew-escape systems are a core safety requirement.',
    whatHappensNext: 'According to the sources, further uncrewed test flights are scheduled; no crewed launch date was confirmed.',
    topics: ['space', 'science', 'india'],
    entities: [org('ISRO'), country('India')],
    confidence: 'high',
    articles: [
      [S.meridian, 'ISRO clears crew-escape test', 11],
      [S.scienceFrontier, 'How India’s crew-escape system works', 9],
      [S.globalWire, 'India’s space agency reports successful safety test', 10],
    ],
  },
  {
    id: 'c-tb-detection',
    headline: 'Researchers report faster, low-cost test for tuberculosis',
    category: 'health',
    country: null,
    importance: 60,
    readMinutes: 1.5,
    summary:
      'A research team described a low-cost test that could detect tuberculosis faster than standard lab methods; larger trials are still needed.',
    whatHappened:
      'In a peer-reviewed study, researchers tested a new diagnostic approach on a limited group of patients and found it identified most confirmed cases within hours.',
    keyPoints: [
      'Results come from a relatively small study.',
      'The test is designed to work without a full laboratory.',
      'Larger clinical trials are needed before routine use.',
    ],
    whyItMatters:
      'Tuberculosis remains one of the world’s deadliest infectious diseases. Faster, cheaper diagnosis could help start treatment sooner.',
    background:
      'Standard TB tests can take days or require equipment that many rural clinics lack.',
    whatHappensNext: 'The researchers say they plan larger trials; approval for clinical use would come later.',
    topics: ['health', 'science'],
    entities: [org('Research team')],
    confidence: 'medium',
    articles: [
      [S.scienceFrontier, 'New TB test shows promise in early study', 14],
      [S.meridian, 'Low-cost TB test could speed up diagnosis', 12],
    ],
  },
  {
    id: 'c-startup-funding',
    headline: 'Startup funding in India rises for a second straight quarter',
    category: 'startups',
    country: 'IN',
    importance: 58,
    readMinutes: 1,
    summary:
      'Venture investment in Indian startups increased again last quarter, led by fintech and climate-tech companies, according to industry trackers.',
    whatHappened:
      'Industry data cited by two outlets shows total funding and deal counts rose compared with the previous quarter, though they remain below peak levels.',
    keyPoints: [
      'Funding rose for a second consecutive quarter.',
      'Fintech and climate tech attracted the most money.',
      'Levels remain below the peak of recent years.',
    ],
    whyItMatters: 'Startup funding drives hiring and innovation, and is a signal of investor confidence.',
    background: 'Global venture funding slowed sharply after interest rates rose, and has been recovering unevenly.',
    whatHappensNext: null,
    topics: ['startups', 'business', 'india', 'finance'],
    entities: [country('India')],
    confidence: 'medium',
    articles: [
      [S.capitalLedger, 'Startup funding climbs again, led by fintech', 13],
      [S.marketReview, 'Indian venture deals edge higher in Q3', 15],
    ],
  },
  {
    id: 'c-oil-prices',
    headline: 'Oil prices ease as supply outlook improves',
    category: 'economy',
    country: null,
    importance: 62,
    readMinutes: 0.75,
    quickRead: true,
    summary: 'Crude prices slipped after producers signalled steady output, easing concerns about tight supply.',
    whatHappened: 'Benchmark crude prices fell modestly during trading after major producers indicated no further output cuts.',
    keyPoints: [
      'Prices fell modestly, not sharply.',
      'Producers signalled steady output.',
      'Lower crude prices can ease fuel import costs for India.',
    ],
    whyItMatters: 'India imports most of its crude oil, so prices affect inflation, the rupee and fuel costs.',
    background: 'Oil prices respond to production decisions, demand forecasts and geopolitical events.',
    whatHappensNext: null,
    topics: ['economy', 'world', 'finance'],
    entities: [org('Oil producers')],
    confidence: 'high',
    articles: [
      [S.marketReview, 'Crude slips on steady supply signals', 3],
      [S.globalWire, 'Oil eases as producers hold output', 2.5],
    ],
  },
  {
    id: 'c-smartphone-manufacturing',
    headline: 'Smartphone makers expand local manufacturing in India',
    category: 'business',
    country: 'IN',
    importance: 55,
    readMinutes: 1,
    summary: 'Several phone makers announced plans to increase production and component sourcing in India.',
    whatHappened: 'Companies said they would add assembly lines and work with more local component suppliers over the coming year.',
    keyPoints: [
      'Plans include new assembly lines and more local suppliers.',
      'Part of the output is expected to be exported.',
      'Government production incentives are a factor, companies said.',
    ],
    whyItMatters: 'Electronics manufacturing can create jobs and increase exports.',
    background: 'India has become one of the largest smartphone production hubs in recent years.',
    whatHappensNext: null,
    topics: ['business', 'technology', 'india'],
    entities: [company('Smartphone makers'), country('India')],
    confidence: 'medium',
    articles: [
      [S.capitalLedger, 'Phone makers widen India production plans', 16],
      [S.circuit, 'More smartphone components to be made locally', 15],
    ],
  },
  {
    id: 'c-university-ai-guidelines',
    headline: 'Universities publish guidelines on using AI in coursework',
    category: 'education',
    country: 'IN',
    importance: 50,
    readMinutes: 1,
    summary: 'A group of universities released common guidelines on when students may use AI tools and how to disclose it.',
    whatHappened: 'The guidelines allow AI for brainstorming and editing in many courses but require disclosure, and leave final rules to instructors.',
    keyPoints: [
      'Students must disclose AI use.',
      'Instructors can set stricter rules for their courses.',
      'The focus is on learning, not just detection.',
    ],
    whyItMatters: 'Millions of students already use AI tools; clear rules reduce confusion and unfair penalties.',
    background: 'Institutions worldwide have struggled to adapt assessment to generative AI.',
    whatHappensNext: 'The universities say the guidelines will be reviewed after one academic year.',
    topics: ['education', 'ai', 'india'],
    entities: [org('Universities')],
    confidence: 'high',
    articles: [
      [S.meridian, 'Universities set out rules for AI in assignments', 18],
      [S.policyWatch, 'AI in classrooms: new guidelines explained', 17],
    ],
  },
  {
    id: 'c-solar-capacity',
    headline: 'Solar capacity additions hit a record in the first half of the year',
    category: 'environment',
    country: 'IN',
    importance: 64,
    readMinutes: 1,
    summary: 'India added more solar power capacity in the first six months of the year than in any previous half-year, industry data shows.',
    whatHappened: 'Data compiled by an industry body shows large utility projects and rooftop installations both grew.',
    keyPoints: [
      'Both large projects and rooftop solar grew.',
      'Transmission capacity remains a bottleneck.',
      'Storage is needed to use more solar power after sunset.',
    ],
    whyItMatters: 'More renewable power can cut emissions and fuel imports, but the grid must keep pace.',
    background: 'India has set long-term targets for non-fossil power capacity.',
    whatHappensNext: null,
    topics: ['environment', 'india', 'economy'],
    entities: [country('India')],
    confidence: 'medium',
    articles: [
      [S.greenPlanet, 'Record half-year for solar installations', 20],
      [S.capitalLedger, 'Solar additions surge; grid constraints remain', 19],
    ],
  },
  {
    id: 'c-upi-phishing',
    headline: 'Cyber agency warns of phishing campaign targeting UPI users',
    category: 'cybersecurity',
    country: 'IN',
    importance: 69,
    readMinutes: 0.75,
    quickRead: true,
    summary: 'India’s cyber-security agency issued an advisory about fake payment-request messages designed to steal UPI PINs.',
    whatHappened: 'The advisory describes messages that impersonate banks or delivery services and ask users to approve payment requests.',
    keyPoints: [
      'Never enter your UPI PIN to receive money.',
      'Verify requests directly in your banking app.',
      'Report suspicious messages to your bank.',
    ],
    whyItMatters: 'UPI is used for billions of payments a month, so scams can reach very large numbers of people.',
    background: 'Payment-request scams exploit the fact that approving a request sends money rather than receiving it.',
    whatHappensNext: null,
    topics: ['cybersecurity', 'india', 'finance'],
    entities: [org('CERT-In'), country('India')],
    confidence: 'high',
    articles: [
      [S.secureLine, 'Advisory: UPI payment-request scams on the rise', 5],
      [S.bharatChronicle, 'Cyber agency flags fake UPI requests', 4],
    ],
  },
  {
    id: 'c-open-model-release',
    headline: 'New open-source AI model draws strong developer interest',
    category: 'ai',
    country: null,
    importance: 52,
    readMinutes: 1,
    summary: 'A newly released open-weight language model became one of the most downloaded on developer platforms within a day.',
    whatHappened: 'The developer published the model under a permissive licence along with benchmark results, which independent testers are now checking.',
    keyPoints: [
      'The model is free to download and modify.',
      'Benchmark claims have not yet been independently confirmed.',
      'Smaller versions can run on a single high-end GPU.',
    ],
    whyItMatters: 'Open models let startups and researchers build AI products without depending on a single provider.',
    background: 'Open and closed AI models are competing on cost, performance and control.',
    whatHappensNext: 'Independent evaluations are expected over the coming weeks, according to the reports.',
    topics: ['ai', 'technology', 'startups'],
    entities: [org('Open-source AI developer')],
    confidence: 'medium',
    articles: [
      [S.circuit, 'Open AI model tops download charts', 30],
      [S.marketReview, 'Developers flock to new open-weight model', 28],
    ],
  },
  {
    id: 'c-markets-steady',
    headline: 'Indian markets close steady ahead of inflation data',
    category: 'finance',
    country: 'IN',
    importance: 48,
    readMinutes: 0.5,
    quickRead: true,
    summary: 'Benchmark indices ended little changed as investors waited for inflation figures.',
    whatHappened: 'Trading was range-bound; banking stocks gained slightly while IT shares dipped.',
    keyPoints: ['Indices ended nearly flat.', 'Banks up slightly, IT down slightly.', 'Investors are watching inflation data.'],
    whyItMatters: 'Inflation data can shift expectations for interest rates, which move markets.',
    background: 'Markets often trade cautiously before major economic data.',
    whatHappensNext: null,
    topics: ['finance', 'india', 'economy'],
    entities: [country('India')],
    confidence: 'high',
    articles: [[S.marketReview, 'Sensex, Nifty flat as investors await data', 26]],
  },
  {
    id: 'c-airline-order',
    headline: 'Domestic airline orders fuel-efficient aircraft to expand routes',
    category: 'business',
    country: 'IN',
    importance: 45,
    readMinutes: 0.75,
    quickRead: true,
    summary: 'An Indian carrier announced an order for new narrow-body aircraft to add regional routes over the next few years.',
    whatHappened: 'The airline said deliveries will be spread over several years and will partly replace older planes.',
    keyPoints: ['Deliveries are spread over several years.', 'Some jets replace older aircraft.', 'Focus is on regional routes.'],
    whyItMatters: 'Air travel demand in India is growing quickly; more capacity can affect fares and connectivity.',
    background: 'India is one of the fastest-growing aviation markets.',
    whatHappensNext: null,
    topics: ['business', 'india'],
    entities: [company('Domestic airline'), country('India')],
    confidence: 'medium',
    articles: [
      [S.capitalLedger, 'Airline places order for new narrow-body jets', 32],
      [S.bharatChronicle, 'Carrier to add regional routes with new aircraft', 31],
    ],
  },
  {
    id: 'c-t20-series',
    headline: 'India wins T20 series with a game to spare',
    category: 'sports',
    country: 'IN',
    importance: 42,
    readMinutes: 0.5,
    quickRead: true,
    summary: 'India secured the T20 series with a comfortable win in the fourth match.',
    whatHappened: 'A strong bowling performance restricted the opposition to a modest total, which India chased down with overs to spare.',
    keyPoints: ['India lead the series with one match left.', 'Bowlers set up the win.', 'Younger players got opportunities.'],
    whyItMatters: 'The series is part of preparations for upcoming international tournaments.',
    background: 'Teams use bilateral series to test combinations before major events.',
    whatHappensNext: null,
    topics: ['sports', 'india'],
    entities: [org('Indian cricket team'), country('India')],
    confidence: 'high',
    articles: [
      [S.meridian, 'India seal T20 series with clinical win', 9],
      [S.bharatChronicle, 'Bowlers shine as India take series', 8.5],
    ],
  },
  {
    id: 'c-coastal-climate-report',
    headline: 'Scientists report faster sea-level rise along parts of Asia’s coast',
    category: 'science',
    country: null,
    importance: 66,
    readMinutes: 1.5,
    summary: 'A study using satellite data found sea levels rising faster than the global average in several Asian coastal regions.',
    whatHappened: 'Researchers combined satellite and tide-gauge records and found above-average rise in some areas, partly due to land subsidence.',
    keyPoints: [
      'Rise is above the global average in several regions.',
      'Land sinking (subsidence) is a contributing factor.',
      'Dense coastal cities face higher flood risk.',
    ],
    whyItMatters: 'Hundreds of millions of people live in low-lying Asian coastal areas.',
    background: 'Sea-level rise comes from warming oceans, melting ice and, locally, land subsidence.',
    whatHappensNext: 'The authors call for better local monitoring; they do not forecast specific flood events.',
    topics: ['science', 'environment', 'world'],
    entities: [org('Research team'), place('Asia')],
    confidence: 'medium',
    articles: [
      [S.scienceFrontier, 'Satellite study finds faster sea-level rise in parts of Asia', 22],
      [S.greenPlanet, 'Sinking land adds to coastal flood risk', 21],
      [S.eastAsiaObserver, 'Asian coastal cities face rising seas, study says', 20],
    ],
  },
];

export const DEMO_STORIES: StoryCluster[] = SPECS.map(build);
