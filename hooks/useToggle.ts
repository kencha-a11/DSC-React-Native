/**
 * MASTERY OF TYPING INPUTS AND OUTPUTS
 * purpose to make the component more predictable
 * 
 * 1. Basics and conventions
 * file name must start with 'use'
 * goal define the types of the parameters going in and the values comming out
 * file naming: use[FeatureName]Hook.ts
 * 
 * 2. A Simple Hook: useToggle
 * manage a bolean state and provides a function to flip it
 */

// useToggle.ts
import { useState, useCallback } from 'react'

export function useToggle(initialValue: boolean = false) {
    // We type the state as a boolean
    const [value, setValue] = useState<boolean>(initialValue)

    const toggle = useCallback(() => setValue((prev) => !prev), [])

    // PRO TIP: 'as const' tells Typescript this is a strict Tuple: [boolean, function]
    // Without it, TS might think it's an array of (boolean | function)[]
    return [value, toggle] as const
}

// usage in a component but must be tsx file to return html elements
// import { useToggle } from './useToggle'
// import { View, TouchableOpacity, Text } from 'react-native'

// function MyComponent() {
//     const [isModalOpen, toggleModal] = useToggle(false)

//     return (
//         <View>
//             <TouchableOpacity onPress={toggleModal}>
//                 {isModapOpen && <Text>The modal is Open!</Text>}
//             </TouchableOpacity>
//         </View>
//     )
// }