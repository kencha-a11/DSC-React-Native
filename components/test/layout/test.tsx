import { View, Text, StyleSheet} from 'react-native'
import ImageTest from '@/components/test/Image/TestImage'

export default function TestScreen() {
    return (
       <ImageTest />
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffff'
    }
})