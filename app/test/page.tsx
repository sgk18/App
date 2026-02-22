"use client"

import { useEffect } from "react"
import { getToken } from "firebase/messaging"
import { messaging } from "@/lib/firebase"

export default function TestPage() {
    useEffect(() => {
        async function getFCMToken() {
            try {
                const permission = await Notification.requestPermission()
                if (permission === "granted" && messaging) {
                    const token = await getToken(messaging, {
                        vapidKey: "BPJaIDq5ebxPwqswjtsgJ7ONiGMBVz4F5bXI4GZpiUTRKDlaSk-76OXvKNQfWQgYTE9HRyTME6W6hLbCDAikrn8",
                    })
                    console.log("FCM Token:", token)
                }
            } catch (error) {
                console.error(error)
            }
        }

        getFCMToken()
    }, [])

    return <div>Check console for FCM token</div>
}