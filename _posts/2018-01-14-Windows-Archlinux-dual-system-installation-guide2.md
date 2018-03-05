---
layout: post
title: windows+Archlinux双系统安装指南(二)
author: AshNobita
tags: [windows, archlinux]
date: 2018-01-16 19:23:00
categories: archlinux
excerpt: "安装windows和Archlinux双系统简单文字指南，采用UEFI+GPT方案，适合于较新的机器"
showimg: "images/windows-archlinux.jpeg"
---

### 声明
&ensp;&ensp;&ensp;&ensp;本安装指南采用的方案为：UEFI+GPT+Grub+rEFInd。

### 安装前准备
1. 已经安装好的windows 8/10系统（本文不会教你如何安装windows系统）
2. 关闭windows系统的快速启动（快速启动会对数据安全造成影响）
3. 准备好大小足够的U盘（能制作启动盘即可）

### 制作启动盘
1.  下载Archlinux镜像（[点击下载](https://www.archlinux.org/download/)）
2. 制作启动盘（这里推荐使用[rufus](https://rufus.akeo.ie/)）
3. 打开运行窗口（快捷键：win + R）输入diskmgmt.msc，打开磁盘管理工具，从原有的磁盘中划分出一部分作为安装Archlinux的分区（如果在安装Windows的时候已经保留了安装分区，那么这步可以省略）
4. 重启电脑，进入UEFI，设置第一启动项为U盘并重启电脑

### 安装Archlinux
1. 连接WIFI
&ensp;&ensp;&ensp;&ensp;Archlinux提供的base中包含netctl、dhcpcd、iw、wpa_supplicant等WiFi连接工具。
&ensp;&ensp;&ensp;&ensp;在命令行键入`wifi-menu`连接WiFi，wifi-menu会提供命令行窗口让你选择要连接的wifi。
&ensp;&ensp;&ensp;&ensp;注意，如果连接失败请尝试手动进行WiFi连接，在命令行输入：
 ```
------------- 手动连接WiFi --------------
ip link #查看你的网卡接口标识
ip link set $iw up # 这里的$iw用上面查出的网卡标识替换，这个命令用于打开网卡接口
iw dev $iw scan | less #用于扫描WiFi信息，如果你知道你需要连接WiFi的SSID，那么这一步可以省略
wpa_supplicant -B -i $iw -c <(wpa_passphrase $SSID $pass) # $SSID代表你WiFi的ID，$pass代表你的wifi密码
iw dev $iw link #查看wifi是否连接成功
```
&ensp;&ensp;&ensp;&ensp;WiFi连接成功后，通过命令：`dhcpcd $iw`来自动分配IP地址。你同样可以手动分配静态IP，在命令行输入：
```
ip addr add 192.168.1.111/24 broadcast 192.168.1.255 dev $iw #ip地址和子网掩码根据你实际的情况替换
ip route add default via 192.168.1.1 dev $iw #设置默认网关
```
2. 基本设置+分区方案+安装Archlinux

磁盘分区：
```
ping -c 4 www.baidu.com #如果ping不通，执行（echo 'nameserver 8.8.8.8' >> /etc/resolv.conf）
timedatectl set-ntp true #更新系统时钟
cfdisk #这个工具会提供一个命令行界面进行分区，根据你的需要进行分区
       # / 分区，类型为linux(必须)
       # /home，类型linux（可选，但建议）
       # swap,类型为linux swap(swap和系统休眠有关，建议根据你的内存大小分配，内存大的交换分区可以分小点，小的可以分大点。当然，你也可以不分)
       # 分区完记得写入
```
设置文件系统
```
mkfs.ext4 /dev/sdax # 磁盘sdax为你划分的linux分区，可以通过fdisk -l查看详细的分区信息，所有linux类型分区都要刷入ext4文件系统
mkswap /dev/sdax # sdax为你所划分的swap分区表示，没有这步可省略
swapon /dev/sdax # 开启swap，没有划分swap，这步可省略
```
挂载linux分区目录
 ```
mount /dev/sdax /mnt 
mkdir /mnt/home #如果没有home分区，这步省略
mount /dev/sdax /mnt/home #如果有没有划分home目录的话，这步省略，如果你还划分了其它目录，也是同样的挂载方法
```
安装Archlinux
```
vim /etc/pacman.d/mirrorlist # 把合适的源调整到第一，比如国内，把china源调整到第一
                             # 这点很重要，不然联网下载包时会很慢
pacstrap /mnt base
pacstrap /mnt base-devel #安装常用开发工具，可以选择不装，但建议安装
```
生成分区表文件
```
genfstab -U /mnt > /mnt/etc/fstab # -U代表用UUID表示分区
```
切换root
```
arch-chroot /mnt
```

### 基本设置和引导启动
安装常用工具
```
pacman -S vim
pacman -S iw wpa_supplicant dialog
```

设置时区
```
ln -sf /usr/share/zoneinfo/Region/City /etc/localtime # Region和City根据你的情况修改，在国内为/Asia/ShangHai
hwclock --systohc
```
设置语言环境
```
#先编辑/etc/locale.gen文件，将en_US.UTF-8 UTF-8注释取消掉，编辑工具可以使用vim
locale-gen # 生成其它需要的本地化文件
echo 'LANG=en_US.UTF-8' >> /etc/locale.conf
```
设置hostname
```
echo 'you host name' > /etc/hostname
```
设置root密码
```
passwd
```
安装微码（非Intel CPU可跳过）
```
pacman -S intel-ucode
```

### 引导系统启动

```
pacman -S grub efibootmgr refind-efi
grub-install /dev/sda # linux系统所在的磁盘，本文采用的方式，windows和linux共用同一个esp分区
refind-intsall
# 需要特别注意，使用virtualBox引导文件总是为$esp/Boot/bootx64
# 所以需要把refind的efi文件拷贝并改名为bootx64，在真机中，可以省略下面步骤
rm -rf $esp/EFI/Boot/bootx64.efi
mv $esp/EFI/refind/refind_x64.efi  $esp/EFI/bootx64.efi
```
重启后即可进入refind.efi界面，选择要引导启动的系统![2018-01-16_220901.png](http://upload-images.jianshu.io/upload_images/6948320-01c83d5ef8ebb4f8.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

### 总结
&ensp;&ensp;&ensp;&ensp;无论是BIOS+MBR或者是UEFI+GPT，甚至也可以是UEFI+MBR（通常建议别这么干，你非要这么干当然也行），其实Archlinux的安装过程几乎是完全一样的，区别只在于，在分区过程中，一个采用MBR的分区方案，一个采用GPT的方案。对于本文介绍的双系统方案，都是利用Windows本身的引导分区，所以省去了自己设置引导分区的麻烦，通常在BIOS+MBR中，主引导记录必须放在磁盘的第一个分区，当然，UEFI并没有这种限制，对于不支持UEFI的主机，推荐使用BIOS+MBR方案，否则的话，尽量采用UEFI+GPT的方案。
&ensp;&ensp;&ensp;&ensp;系统安装的一个重点就在于启动加载器和引导加载器，这两者都有许多方案，可以根据个人喜好选择，详细信息建议参考[ArchWiki](https://wiki.archlinux.org/index.php/Installation_guide)。对于本文UEFI+GPT采用的引导方案为rEFInd作为启动加载器，grub作为引导加载器。
&ensp;&ensp;&ensp;&ensp;有什么问题，欢迎留言询问。