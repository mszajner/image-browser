import {Dimensions, Image, ScrollView, StyleSheet, Text, View} from "react-native";
import config from "./config";
import {useEffect, useState} from "react";
import md5 from "md5";
import _ from "lodash";
import {ActivityIndicator} from "react-native-paper";

const {width} = Dimensions.get('window');

const processImages = async images => {
    const processedImages = [...images];
    for (const i in images) {
        const image = processedImages[i];
        await Image.getSize(image.url, (width, height) => {
            processedImages[i] = {...image, width, height};
        });
    }
    return processedImages;
}

const renderItem = ({id, url}, ht, wd, imageSpacing) => (
    <Image
        key={id}
        source={{uri: url}}
        style={{width: wd, height: ht, marginBottom: imageSpacing}}
        resizeMode="contain"
    />
);

const Fetch = async (method, uri, headers, body) => {
    const init = {
        method: method,
        credentials: 'include',
        headers: {
            ...headers,
            'Accept': 'application/json',
            'Authorization': 'Client-ID ' + config.access_key
        },
        cache: 'no-cache',
        redirect: 'follow',
        body: body !== null ? JSON.stringify(body) : null,
    };
    let url = config.url + uri;
    let response = await fetch(url, init);
    let text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.log(e);
        return {
            "errors": [text]
        };
    }
}

const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
}

export default function UnsplashWall({q}) {

    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [maxPage, setMaxPage] = useState(0);

    const columns = 2;
    const COLUMN_WIDTH = width / columns;
    const IMAGE_SPACING = COLUMN_WIDTH * 0.005;
    const COL_WIDTH = COLUMN_WIDTH - (IMAGE_SPACING / 2);

    const [cols, setCols] = useState(Array(columns).fill(columns).map(_ => ({bricks: [], colHeight: 0})));

    const layoutBricks = (images) => {
        const newCols = [...cols];

        images.forEach((image) => {
            let wd = COL_WIDTH;
            const widthReductionFactor = COL_WIDTH / image.width;
            const ht = image.height * widthReductionFactor;
            const currentImage = renderItem(image, ht, wd, IMAGE_SPACING);

            const heightsArray = newCols.map(({colHeight}) => colHeight);
            const shortestColumnIndex = heightsArray.findIndex(colHt => colHt === Math.min.apply(Math, heightsArray));
            const shortestColumn = newCols[shortestColumnIndex];

            newCols[shortestColumnIndex] = {
                bricks: [...shortestColumn.bricks, currentImage],
                colHeight: shortestColumn.colHeight + ht
            };
        });

        setCols(newCols);
    }

    const search = async () => {
        setLoading(true);
        let response = await Fetch('GET', '/search/photos?query='
            + encodeURI(q) + '&lang=pl&page=' + page, {}, null);
        setErrors(response.errors ?? []);
        if (response.results !== undefined) {
            const images = response.results.map(i => i.urls.small);
            setMaxPage(response.total_pages ?? 0);
            layoutBricks(await processImages(images.map(url => ({id: md5(url), url}))));
        } else {
            layoutBricks([]);
        }
        setLoading(false);
    }


    const handleOnScroll = async ({nativeEvent}) => {
        if (isCloseToBottom(nativeEvent)) {
            if (page < maxPage) {
                console.log('request for next page');
                setPage(page + 1);
                await search();
            }
        }
    }

    useEffect(() => {
        setPage(1);
        // noinspection JSIgnoredPromiseFromCall
        search(q);
    }, [q]);

    return (
        <>
            <ScrollView style={styles.scrollView} removeClippedSubviews onScroll={handleOnScroll}>
                {!_.isEmpty(errors)
                    ? errors.map((err, i) => <Text key={i} style={styles.errorMessage}>{err}</Text>)
                    : ((page === 1) && loading ? <></> : <View style={styles.wallView}>
                        {cols.map(({bricks}, i) => (<View key={i}>{bricks}</View>))}
                    </View>)
                }
            </ScrollView>
            {loading && <View style={styles.activityIndicator}>
                <ActivityIndicator animation={true} size="large"/>
            </View>}
        </>
    );
}

const styles = StyleSheet.create({
    activityIndicator: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)'
    },
    scrollView: {
        flex: 1,
    },
    wallView: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    searchBox: {
        marginBottom: 10
    },
    errorMessage: {
        color: 'red'
    },
});
