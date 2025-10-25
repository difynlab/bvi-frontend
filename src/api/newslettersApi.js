import newslettersService from '../services/newslettersService'

// API wrapper para newsletters usando NewsletterService
export const newslettersApi = {
  // Obtener todos los newsletters con paginación
  getAll: async (pagination = 6, page = 1) => {
    try {
      return await newslettersService.getNewsletters(pagination, page)
    } catch (error) {
      console.error('Error in newslettersApi.getAll:', error)
      throw error
    }
  },

  // Obtener un newsletter por ID
  getById: async (id) => {
    try {
      return await newslettersService.getNewsletter(id)
    } catch (error) {
      console.error('Error in newslettersApi.getById:', error)
      throw error
    }
  },

  // Crear un nuevo newsletter
  create: async (newsletterData) => {
    try {
      return await newslettersService.createNewsletter(newsletterData)
    } catch (error) {
      console.error('Error in newslettersApi.create:', error)
      throw error
    }
  },

  // Actualizar un newsletter existente
  update: async (id, newsletterData) => {
    try {
      return newslettersService.updateNewsletter(id, newsletterData)
    } catch (error) {
      console.error('Error in newslettersApi.update:', error)
      throw error
    }
  },

  // Eliminar un newsletter
  delete: async (id) => {
    try {
      return await newslettersService.deleteNewsletter(id)
    } catch (error) {
      console.error('Error in newslettersApi.delete:', error)
      throw error
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return newslettersService.isAuthenticated()
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    return newslettersService.getCurrentUser()
  }
}

export default newslettersApi
