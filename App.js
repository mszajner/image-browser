import {SafeAreaView, StyleSheet} from 'react-native';
import {useEffect, useRef, useState} from "react";
import Constants from "expo-constants";
import _, {debounce} from 'lodash';
import {TextInput} from 'react-native-paper';
import UnsplashWall from "./UnsplashWall";

export default function App() {

    const [q, setQ] = useState('');

    const search = useRef(
        debounce(async (v) => {
            if (_.isEmpty(v) || v.length <= 2) {
                return;
            }
            v = v.trim();
            if (v.length <= 2) {
                return;
            }
            setQ(v);
        }, 300)
    ).current;

    useEffect(() => {
        return () => {
            search.cancel();
        };
    }, [search]);

    return (
        <SafeAreaView style={styles.container}>
            <TextInput onChangeText={(v) => search(v)} style={styles.searchBox}
                       label="Co chcesz obejrzeć?"/>
            <UnsplashWall q={q}/>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10 + Constants.statusBarHeight,
        paddingHorizontal: 10,
    },
    searchBox: {
        marginBottom: 10
    }
});
