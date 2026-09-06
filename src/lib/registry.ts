// Static registries mirrored from the backend /registry folder.
// vasp_labels.json, mixer_contracts.json, swap_services.json, otc_hawala.json

export interface VaspDirectoryEntry {
  name: string;
  addresses: string[];
  chains: string[];
  jurisdiction: string;
  fiuRegistered: boolean;
  travelRule: string;
  instrument: string;
  contact: string;
  responseSla: string;
  cooperation: "confirmed" | "responsive" | "slow" | "untested";
}

export const VASP_DIRECTORY: VaspDirectoryEntry[] = [
  {
    name: "CoinDCX",
    addresses: [
      "0x4d24eececb86041f47bca41265319e9f06ae2fcb",
      "0x8c7efd5b04331efc618e8006f19019a3dc88973e",
    ],
    chains: ["ethereum"],
    jurisdiction: "India",
    fiuRegistered: true,
    travelRule: "Notabene — participating",
    instrument: "SAHYOG / PMLA s.12AA",
    contact: "nodal-officer@coindcx.example",
    responseSla: "72 hrs",
    cooperation: "confirmed",
  },
  {
    name: "WazirX",
    addresses: ["0x0e293a9e57d22f6ec575b376e3e3bd8e642fd5fc"],
    chains: ["ethereum"],
    jurisdiction: "India",
    fiuRegistered: true,
    travelRule: "Sygna Bridge — participating",
    instrument: "SAHYOG / PMLA s.12AA",
    contact: "compliance@wazirx.example",
    responseSla: "72 hrs",
    cooperation: "responsive",
  },
  {
    name: "Binance",
    addresses: [
      "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be",
      "0xf977814e90da44bfa03b6295a0616a897441acec",
      "0x8894e0a0c962cb723c1976a4421c95949be2d4e3",
      "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
    ],
    chains: ["ethereum", "tron"],
    jurisdiction: "Offshore (re-registered with FIU-IND)",
    fiuRegistered: true,
    travelRule: "TRP — participating",
    instrument: "SAHYOG, escalate via Egmont FIU channel",
    contact: "le-requests@binance.example",
    responseSla: "5–10 days",
    cooperation: "responsive",
  },
  {
    name: "OKX",
    addresses: ["0x6cc59efa43553254170ec3026056cb1d36df1226", "TNEvXvQzW37Q7S5v9WzY8Vb9uXnsjwAzwA"],
    chains: ["ethereum", "tron"],
    jurisdiction: "Seychelles",
    fiuRegistered: false,
    travelRule: "TRP — participating",
    instrument: "MLAT / Egmont Group FIU-to-FIU",
    contact: "lawenforcement@okx.example",
    responseSla: "15–30 days",
    cooperation: "slow",
  },
  {
    name: "Kraken",
    addresses: [
      "0xf30ba13e4b04ce5dc4d254ae5fa95477800f0eb0",
      "0xcc282e2004428939ee5149a9e7872f0b4d5d5ec7",
    ],
    chains: ["ethereum"],
    jurisdiction: "United States",
    fiuRegistered: false,
    travelRule: "Notabene — participating",
    instrument: "MLAT (India–US)",
    contact: "compliance@kraken.example",
    responseSla: "30–60 days",
    cooperation: "responsive",
  },
  {
    name: "KuCoin",
    addresses: ["0xa152f8bb749c55e9943a3a0a3111d18ee2b3f94e", "TUhvXvQzW37Q7S5v9WzY8Vb9uXnsjwAzwD"],
    chains: ["ethereum", "tron"],
    jurisdiction: "Seychelles",
    fiuRegistered: true,
    travelRule: "Sygna Bridge — participating",
    instrument: "SAHYOG (registered entity)",
    contact: "le@kucoin.example",
    responseSla: "10–15 days",
    cooperation: "untested",
  },
  {
    name: "Huobi / HTX",
    addresses: ["0xd65cd6099d6db8b58641473fa5d9d3b5c70c6a5a", "TDpXvQzW37Q7S5v9WzY8Vb9uXnsjwAzwB"],
    chains: ["ethereum", "tron"],
    jurisdiction: "Seychelles",
    fiuRegistered: false,
    travelRule: "Not disclosed",
    instrument: "MLAT / Egmont Group FIU-to-FIU",
    contact: "legal@htx.example",
    responseSla: "30+ days",
    cooperation: "slow",
  },
  {
    name: "Bybit",
    addresses: ["0xf89d7b9c864f589bbf53a82105107622b35eaa40", "TNo3SbxZ4X58Y4D6U9RzZ6S8c1H3bK9P7B"],
    chains: ["ethereum", "tron"],
    jurisdiction: "UAE",
    fiuRegistered: false,
    travelRule: "TRP — participating",
    instrument: "MLAT (India–UAE) / Egmont",
    contact: "le@bybit.example",
    responseSla: "15–30 days",
    cooperation: "untested",
  },
];

export const MIXER_CONTRACTS = [
  {
    address: "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
    name: "Tornado Cash: 0.1 ETH pool",
    chain: "ethereum",
  },
  {
    address: "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
    name: "Tornado Cash: 1 ETH pool",
    chain: "ethereum",
  },
  {
    address: "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
    name: "Tornado Cash: 10 ETH pool",
    chain: "ethereum",
  },
  {
    address: "0xa160cdab225685da1d56aa342ad8841c3b53f291",
    name: "Tornado Cash: 100 ETH pool",
    chain: "ethereum",
  },
];

export const SWAP_SERVICES = [
  {
    address: "0x9f4cf329f4cf376b7aded854d6054859dd102a2a",
    name: "ChangeNOW hot wallet",
    chain: "ethereum",
  },
  {
    address: "0x3c2fbd3d8b1c1a1a4a0a5f1b4e8a5d3e2c1b0a9f",
    name: "FixedFloat hot wallet",
    chain: "ethereum",
  },
  {
    address: "TXTG9SbxZ4X58Y4D6U9RzZ6S8c1H3bK9P8",
    name: "SimpleSwap reserve (TRC20)",
    chain: "tron",
  },
];

export const OTC_HAWALA_REGISTRY = [
  {
    address: "TR8cKtayd6hkoT5dDyGTcKWWTJsDfRGjPH",
    chain: "tron",
    confirmedCase: "FIR-2025-0447",
    note: "Confirmed cash-out terminus, Surat",
  },
  {
    address: "TLyD14Nj9j7xAB4dbGeiX9h8unkKHxuWwA",
    chain: "tron",
    confirmedCase: "FIR-2025-0912",
    note: "Repeat many-in/no-out pattern",
  },
];

export const BRIDGE_CONTRACTS = [
  {
    address: "0x3ee18b2214aff97000d974cf647e7c347e8fa585",
    name: "Wormhole: Token Bridge",
    chain: "ethereum",
  },
  {
    address: "0x8484ef722627bf18ca5ae6bcf031c23e6e922b30",
    name: "Polygon: PoS Bridge",
    chain: "ethereum",
  },
];
