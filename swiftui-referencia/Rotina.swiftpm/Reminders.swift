import UserNotifications

/// Um aviso diário no início de cada bloco.
enum Reminders {
    static func enable(wake: Int) async -> Bool {
        let center = UNUserNotificationCenter.current()
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        if granted { schedule(wake: wake) }
        return granted
    }

    static func schedule(wake: Int) {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()

        for block in Routine.blocks {
            let t = (wake + block.start) % 1440
            var when = DateComponents()
            when.hour = t / 60
            when.minute = t % 60

            let content = UNMutableNotificationContent()
            content.title = block.title
            content.body = block.action
            content.sound = .default

            let trigger = UNCalendarNotificationTrigger(dateMatching: when, repeats: true)
            center.add(UNNotificationRequest(identifier: block.id, content: content, trigger: trigger))
        }
    }

    static func disable() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
