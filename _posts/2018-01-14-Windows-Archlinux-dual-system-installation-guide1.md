---
layout: post
title: windows+Archlinux双系统安装指南(一)
author: AshNobita
tags: [windows, archlinux]
date: 2018-01-14 16:22:00
categories: archlinux
excerpt: "安装windows和Archlinux双系统简单文字指南，采用BIOS+MBR方案，适合于老型号机器"
showimg: "images/windows-archlinux.jpeg"
---

### 声明
&ensp;&ensp;&ensp;&ensp;本安装指南采用传统BIOS+BMR分区方案+GRUB引导，适用于早期的电脑，现在大多数电脑基本是UEFI+GPT的方案，这种安装方式将再下一篇文章中介绍。虽然Linux对BIOS的分区方案没有严格限制，但是Windows上却有，基于这点考量，最好采用BIOS+MBR或者UEFI+GPT的方式。

### 安装前准备
1. 已经安装好的windows7系统（本文不会教你如何安装windows系统）
2. 准备好大小足够的U盘（能制作启动盘即可）

### 制作启动盘
1.  下载Archlinux镜像（[点击下载](https://www.archlinux.org/download/)）
2. 制作启动盘（这里推荐使用[rufus](https://rufus.akeo.ie/)）
3. 打开运行窗口（快捷键：win + R）输入diskmgmt.msc，打开磁盘管理工具，从原有的磁盘中划分出一部分作为安装Archlinux的分区（如果在安装Windows的时候已经保留了安装分区，那么这步可以省略）
4. 重启电脑，进入BIOS，设置第一启动项为U盘并重启电脑

### 安装Archlinux
1. 连接WIFI
&ensp;&ensp;&ensp;&ensp;Archlinux提供的base中包含netctl、dhcpcd、iw、wpa_supplicant等WiFi连接工具。
&ensp;&ensp;&ensp;&ensp;在命令行键入`wifi-menu`连接WiFi，wifi-menu会提供命令行窗口让你选择要连接的wifi。
&ensp;&ensp;&ensp;&ensp;注意，如果连接失败请尝试手动进行WiFi连接，在命令行输入：
 ```
--------------------- 手动连接WiFi ---------------------------
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
pacman -S ntfs-3g
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
pacman -S grub
chattr -i /boot/grub/i386-pc/core.img
grub-install --target=i386-pc --debug --force /dev/sdaX
chattr +i /boot/grub/i386-pc/core.img
grub-mkconfig -o /boot/grub/grub.cfg
my_windows_part=/dev/sdax # sdax代表你的windows C盘目录，一般是sda2
my_boot_part=/dev/sdax # sdax代表你的linux /分区目录
mkdir -p /media/win
mount -t ntfs-3g $my_windows_part /media/win
dd if=$my_boot_part of=/media/win/linux.bin bs=512 count=1 #这个命令会在你的windows C盘根目录底下生成linux.bin文件
```
重启进入windows，以管理员的方式打开命令行
```
bcdedit /create /d "Linux" /application BOOTSECTOR # 生成启动标识，生成结果就是下面的ID, "Linux"可以替换成任何你想在显示的内容
bcdedit /set {ID} device partition=C:
bcdedit /set {ID}  path \linux.bin
bcdedit /displayorder {ID} /addlast
bcdedit /timeout 30
```

###Finished! 重启即可！