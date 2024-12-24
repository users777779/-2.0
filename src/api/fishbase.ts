import axios from 'axios'

const FISHBASE_ENDPOINT = 'https://fishbase.org/sparql'

export interface FishSpecies {
  SpecCode: number
  Genus: string
  Species: string
  FamCode: number
  Family: string
  Order: string
  Class: string
  CommonName: string
  Length: number
  Weight: number
  Habitat: string
  Distribution: string
  Temperature: string
  Importance: string
}

export const fishbaseApi = {
  // 搜索鱼类
  searchSpecies: async (query: string) => {
    const sparqlQuery = `
      PREFIX fb: <http://fishbase.org/entity/>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      SELECT DISTINCT ?species ?name ?family ?order ?habitat
      WHERE {
        ?species rdfs:label ?name .
        ?species fb:family ?family .
        ?species fb:order ?order .
        ?species fb:habitat ?habitat .
        FILTER(CONTAINS(LCASE(?name), LCASE("${query}")))
      }
      LIMIT 50
    `
    const response = await axios.get(FISHBASE_ENDPOINT, {
      params: {
        query: sparqlQuery,
        format: 'json',
      },
    })
    return response.data.results.bindings
  },

  // 获取鱼类详情
  getSpeciesById: async (specCode: number) => {
    const response = await axios.get(`${FISHBASE_ENDPOINT}/species/${specCode}`)
    return response.data.data as FishSpecies
  },

  // 获取分布信息
  getDistribution: async (specCode: number) => {
    const response = await axios.get(`${FISHBASE_ENDPOINT}/distribution/${specCode}`)
    return response.data.data
  },

  // 获取生态信息
  getEcology: async (specCode: number) => {
    const response = await axios.get(`${FISHBASE_ENDPOINT}/ecology/${specCode}`)
    return response.data.data
  },
}
