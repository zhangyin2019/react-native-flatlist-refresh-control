import React from 'react';
import {
  FlatList,
  Image,
  View,
  Text,
  TouchableNativeFeedback,
  TouchableHighlight,
} from 'react-native';
import common from './class/common';
import {FETCH} from '../utils/common';
import _s from '../utils/public';

class Page extends common {
  last_id = 0;
  scrollTop = 0;
  refreshHeight = this.S_H;
  refreshTriggerTop = parseInt(this.refreshHeight * 0.9); // 触发下拉刷新的区域占比高

  constructor(props) {
    super(props);

    this.state = {
      pullRefreshing: 0, // 0-下拉加载 1-加载中 2-释放刷新
      list: [],
      noMore: false,
    };
  }

  componentDidMount() {
    // 监听路由
    this.props.navigation.addListener('focus', () => {
      console.log('article focus');

      // 重新刷新
      let {list} = this.state;
      if (!list.length) {
        // 初始下拉刷新需要收回去
        this?.FlatListRef?.scrollToOffset({
          offset: this.S_H,
          animated: false,
        });
        this.onRefresh();
      }

      this.exitAppToast();
    });
  }

  // 下拉刷新
  onRefresh() {
    this.getList(true);
  }

  // 获取列表
  getList(needNew) {
    let {last_id, state} = this,
      {noMore, list} = state;

    needNew && (last_id = 0);
    if (!last_id) noMore = false;
    if (noMore) return;

    FETCH({
      url: 'xxx',// xxx-自己的请求链接
      data: {last_id},
    }).then((res) => {
      let arr = res.data,
        len = arr.length;
      if (len) {
        const temp_last_id = arr[len - 1].id - 100; // 100 是往后的ID差值

        // 去重
        let idArr = last_id ? list.map((item) => item.id) : [];
        arr = arr.filter((item) => idArr.indexOf(item.id) < 0);
        list = last_id ? list.concat(arr) : arr;
        last_id = temp_last_id;

        // 每次最多10条
        if (len < 10) noMore = true;
      } else {
        if (!last_id) list = [];
        noMore = true;
      }
      this.last_id = last_id;
      this.setState({
        noMore,
        list,
      });
    });
  }

  render() {
    let {noMore, list, pullRefreshing} = this.state;

    return (
      <View style={[_s.flex_1, _s.bg_col_fff]}>
        {/* 列表 */}
        <FlatList
          ref={(r) => (this.FlatListRef = r)}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => (this.scrollBeginDrag = true)}
          onScroll={(e) => {
            let y = (this.scrollTop = parseInt(e.nativeEvent.contentOffset.y));

            if (y <= this.refreshHeight) {
              if (this.scrollBeginDrag) {
                // 下拉状态变化
                if (y < this.refreshTriggerTop) {
                  pullRefreshing != 2 && this.setState({pullRefreshing: 2});
                } else if (y == this.refreshTriggerTop) {
                  this.setState({pullRefreshing: 1});
                } else {
                  pullRefreshing != 0 && this.setState({pullRefreshing: 0});
                }
              } else {
                // 阻止惯性滑到下拉区域
                this.scrollBeginDrag = true;
                this.FlatListRef.scrollToOffset({
                  offset: this.refreshHeight,
                  animated: true,
                });
                setTimeout(() => {
                  this.scrollBeginDrag = true;
                }, 200);
              }
            }
          }}
          onScrollEndDrag={() => {
            this.scrollBeginDrag = false;

            // 在刷新区域
            if (this.scrollTop <= this.refreshTriggerTop) {
              this.onRefresh();

              // 弹到加载中位置
              this.scrollBeginDrag = true;
              this.FlatListRef.scrollToOffset({
                offset: this.refreshTriggerTop,
                animated: true,
              });
              setTimeout(() => {
                // 触发刷新后，又离开刷新区域的不回弹
                if (this.scrollTop <= this.refreshTriggerTop) {
                  this.FlatListRef.scrollToOffset({
                    offset: this.refreshHeight,
                    animated: true,
                  });
                }
                setTimeout(() => {
                  this.scrollBeginDrag = true;
                }, 200);
              }, 1500);
            } else if (
              this.scrollTop > this.refreshTriggerTop &&
              this.scrollTop < this.refreshHeight
            ) {
              // 未在刷新区域
              this.scrollBeginDrag = true;
              this.FlatListRef.scrollToOffset({
                offset: this.refreshHeight,
                animated: true,
              });
              setTimeout(() => {
                this.scrollBeginDrag = true;
              }, 200);
            }
          }}
          data={list}
          keyExtractor={(_, index) => index.toString()}
          ListHeaderComponent={
            <>
              <View height={this.refreshHeight} style={[_s.ju_end]}>
                <View style={[_s.flex_dir_row, _s.ju_cen, _s.ali_cen]}>
                  {pullRefreshing == 1 ? (
                    <Image
                      style={[_s.w_24_h_24]}
                      source={{
                        uri:
                          'http://www.sucaijishi.com/uploadfile/2015/0210/20150210104952902.gif',
                        cache: 'force-cache',
                      }}
                    />
                  ) : null}
                  <Text style={[_s.font_15]}>
                    {['下拉刷新', '加载中..', '释放刷新'][pullRefreshing]}
                  </Text>
                </View>
              </View>
              <View style={{height: this.STATUSBAR_HEIGHT - 10}}></View>
            </>
          }
          renderItem={({item, index: i}) => {
            let TouchEffect = TouchableNativeFeedback;
            this.IS_IOS && (TouchEffect = TouchableHighlight);
            return (
              <TouchEffect
                key={i}
                background={TouchableNativeFeedback.Ripple('#ccc')}
                underlayColor="#eee"
                onPress={() => {
                  this.props.navigation.navigate('webView', item);
                }}>
                <View style={[_s.flex_dir_row, _s.p_15]}>
                  <Image
                    style={[_s.bor_rad_5, _s.bor_sol_eee]}
                    source={{
                      width: this.S_W * 0.24,
                      height: this.S_W * 0.24,
                      uri: item.thumbnail,
                    }}
                  />
                  <View style={{flex: 1, marginLeft: 15}}>
                    <Text
                      style={[_s.col_444, _s.font_bold, _s.txt_jus]}
                      numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text
                      style={[_s.flex_1, _s.col_999, _s.font_12]}
                      numberOfLines={2}>
                      {item.summary}
                    </Text>
                    <Text style={[_s.col_bbb, _s.font_12, _s.txt_r]}>
                      {item.published_time}
                    </Text>
                  </View>
                </View>
              </TouchEffect>
            );
          }}
          ItemSeparatorComponent={() => (
            <View style={[_s.bor_sol_b_eee, _s.m_0_15]} />
          )}
          enableFooterInfinite={false}
          ListFooterComponent={
            <View
              style={[
                {
                  height: list.length ? 'auto' : this.S_H,
                  paddingBottom: this.STATUSBAR_HEIGHT * 0.5,
                },
              ]}>
              <Text style={[_s.txt_cen, _s.col_999, _s.p_20_0]}>
                {noMore
                  ? list.length
                    ? '没有更多了'
                    : '暂无数据'
                  : '加载中..'}
              </Text>
            </View>
          }
          onEndReachedThreshold={0.1}
          onEndReached={() => this.getList()}
        />
      </View>
    );
  }
}

export default Page;
