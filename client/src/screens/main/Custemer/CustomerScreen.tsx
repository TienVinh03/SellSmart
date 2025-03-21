import React from 'react';
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {BaseLayout, DynamicText, Header} from '../../../components';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  color,
  moderateScale,
  scaledSize,
  scaleHeight,
  scaleWidth,
} from '../../../utils';
import {contents} from '../../../context';
import {Images} from '../../../assets';
import {useNavigation} from '@react-navigation/native';

const CustomerScreen = () => {
  const navigation = useNavigation<any>();
  const renderItem = ({item}: any) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image source={Images.SHOP} style={styles.avatar} />
        <View>
          <DynamicText style={styles.name}>{item.name}</DynamicText>
          <DynamicText style={styles.phone}>
            {contents.employee.phone_label}
            {item.phone}
          </DynamicText>
        </View>
      </View>
    </View>
  );

  return (
    <BaseLayout>
      {/* Header mới */}
      <Header
        title={contents.customer.title}
        showBackIcon={true}
        onPressBack={() => navigation.goBack()}
        showRightIcon={true}
        RightIcon={false}
      />

      {/* Danh sách nhân viên */}
      <FlatList
        data={contents.employee.employees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      {/* Thanh công cụ */}
      <View style={styles.toolbar}>
        <View style={styles.toolbar3}>
          <ToolbarButton icon="add" label={contents.employee.toolbar.add} />
          <ToolbarButton
            icon="filter-outline"
            label={contents.employee.toolbar.filter}
          />
          <ToolbarButton
            icon="swap-vertical-outline"
            label={contents.employee.toolbar.sort}
          />
        </View>

        <ToolbarButton
          icon="search-outline"
          label={contents.employee.toolbar.search}
        />
      </View>
    </BaseLayout>
  );
};

export default CustomerScreen;

const ToolbarButton = ({icon, label}: any) => (
  <TouchableOpacity style={styles.iconButton}>
    <Icon name={icon} size={24} color={color.primaryColor} />
    <DynamicText style={styles.iconText}>{label}</DynamicText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  card: {
    width: '100%', // Chiếm toàn bộ chiều ngang
    backgroundColor: color.accentColor.whiteColor,
    padding: scaleWidth(16),
    borderRadius: moderateScale(12),
    marginBottom: scaleHeight(12),
    shadowColor: color.accentColor.darkColor,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'stretch', // Đảm bảo phần tử mở rộng tối đa
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: scaleWidth(50),
    height: scaleHeight(50),
    borderRadius: scaledSize(25),
    marginRight: scaleWidth(12),
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  phone: {
    fontSize: moderateScale(12),
    color: color.accentColor.grayColor,
  },
  position: {
    fontSize: moderateScale(14),
  },
  positionText: {
    color: color.primaryColor,
    fontSize: moderateScale(14),
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleWidth(16),
    paddingVertical: scaleHeight(1),
    backgroundColor: color.accentColor.whiteColor,
  },

  toolbar3: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Đẩy nhóm nút về bên trái
    flex: 1, // Để nó chiếm phần lớn không gian
    gap: scaleWidth(30),
  },

  iconButton: {
    alignItems: 'center',
  },
  iconText: {
    fontSize: moderateScale(12),
    color: color.primaryColor,
    marginTop: scaleHeight(4),
  },
});
