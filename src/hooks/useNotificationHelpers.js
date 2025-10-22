import { useNotifications } from '../context/NotificationContext'

export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications()

  const notifyEventCreated = (eventTitle, eventDate, eventTime, eventLocation) => {
    const formatDate = (dateString) => {
      const date = new Date(dateString + 'T12:00:00')
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }

    addNotification({
      type: 'event_created',
      title: eventTitle,
      message: `Check the new scheduled event on ${formatDate(eventDate)}`,
      eventDate: eventDate,
      eventTime: eventTime,
      eventLocation: eventLocation
    })
  }

  // Notificaciones de actualización y eliminación deshabilitadas
  // const notifyEventUpdated = (eventTitle) => {
  //   addNotification({
  //     type: 'event_updated',
  //     title: 'Event Updated',
  //     message: `"${eventTitle}" has been updated successfully`
  //   })
  // }

  // const notifyEventDeleted = (eventTitle) => {
  //   addNotification({
  //     type: 'event_deleted',
  //     title: 'Event Deleted',
  //     message: `"${eventTitle}" has been deleted successfully`
  //   })
  // }

  const notifyCustom = (type, title, message) => {
    addNotification({
      type,
      title,
      message
    })
  }

  return {
    notifyEventCreated,
    // notifyEventUpdated, // Deshabilitado
    // notifyEventDeleted, // Deshabilitado
    notifyCustom
  }
}

// TODO: Implementar sistema real con WebSockets
// const useWebSocketNotifications = () => {
//   const { addNotification } = useNotifications()
//   
//   useEffect(() => {
//     const ws = new WebSocket('ws://localhost:8000/ws/notifications')
//     
//     ws.onopen = () => {
//       console.log('WebSocket connection established')
//     }
//     
//     ws.onmessage = (event) => {
//       try {
//         const notification = JSON.parse(event.data)
//         addNotification(notification)
//       } catch (error) {
//         console.error('Error parsing WebSocket message:', error)
//       }
//     }
//     
//     ws.onclose = () => {
//       console.log('WebSocket connection closed')
//       // Implementar reconexión automática
//       setTimeout(() => {
//         useWebSocketNotifications()
//       }, 5000)
//     }
//     
//     ws.onerror = (error) => {
//       console.error('WebSocket error:', error)
//     }
//     
//     return () => {
//       ws.close()
//     }
//   }, [addNotification])
// }
