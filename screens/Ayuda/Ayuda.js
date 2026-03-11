import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, Linking } from "react-native";

export default () => {
  const CONTACT_METHODS = [
    {
      title: "Llamar",
      logo: require('../../assets/telefono.png'),
      link: "tel:+5492227676612",
    },
    {
      title: "WhatsApp",
      logo: require('../../assets/whatsapp.png'),
      link: "http://api.whatsapp.com/send?phone=5492227676612",
    },
    {
      title: "E-mail",
      logo: require('../../assets/email.png'),
      link: "mailto:infofarmerin@gmail.com",
    },
  ];

  const SOCIAL_MEDIA = [
    {
      title: "YouTube",
      logo: require('../../assets/yt.png'),
      link: "https://www.youtube.com/channel/UCPG5tI4805MPm6jshejr5vA"
    },
    {
      title: "Facebook",
      logo: require('../../assets/facebookicono.png'),
      link: "https://www.facebook.com/farmerinarg"
    },
    {
      title: "Instagram",
      logo: require('../../assets/instagramicono.png'),
      link: "https://www.instagram.com/farmerinar/"
    }
  ];

  const navegar = (link) => Linking.openURL(link);

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Contacto</Text>
      <View style={styles.contactContainer}>
        {CONTACT_METHODS.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contactButton}
            onPress={() => navegar(item.link)}
          >
            <Image source={item.logo} style={styles.icon} />
            <Text style={styles.buttonText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <Text style={styles.headerText}>Redes Sociales</Text>
      <View style={styles.socialContainer}>
        {SOCIAL_MEDIA.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.socialButton}
            onPress={() => navegar(item.link)}
          >
            <Image source={item.logo} style={styles.socialIcon} />
            <Text style={styles.socialText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Logo de la empresa */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/logolargo2.png')} style={styles.logo} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
    padding: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b829b',
    marginBottom: 10,
    textTransform: "uppercase",
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  contactButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    width: '30%',
  },
  icon: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  buttonText: {
    fontSize: 14,
    color: '#00796b',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    alignItems: 'center',
    padding: 10,
    width: '30%',
  },
  socialIcon: {
    width: 30,
    height: 30,
    marginBottom: 5,
  },
  socialText: {
    fontSize: 14,
    color: '#444',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 250, // Ajusta el ancho del logo
    height: 250, // Ajusta la altura del logo
    resizeMode: 'contain', // Mantiene la relación de aspecto del logo
  },
});
